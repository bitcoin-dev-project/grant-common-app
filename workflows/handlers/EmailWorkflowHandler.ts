import axios from 'axios';
import sgMail from '@sendgrid/mail';
import { Organization } from '../../config/organizations';
import organizations from '../../config/organizations';
import { WorkflowHandler, SubmissionResponse, mapFields } from '../WorkflowHandler';

// Initialize SendGrid with API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Handles submissions to email-based workflows
 */
export class EmailWorkflowHandler implements WorkflowHandler {
  /**
   * Submits an application to an organization using email
   * @param application The application data to submit
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  async submit(application: Record<string, unknown>, org: Organization): Promise<SubmissionResponse> {
    try {
      if (!org.workflowConfig?.emailRecipients || org.workflowConfig.emailRecipients.length === 0) {
        throw new Error('Email recipients are not configured for this organization');
      }

      // Apply field mapping if available
      const mappedApplication = mapFields(application, org.fieldMapping || {});
      
      // Use SendGrid directly for all email-based workflows
      return this.submitViaSendGrid(mappedApplication, org);
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: unknown } };
      console.error(`Error sending ${org.name} application via email:`, err);
      
      return {
        success: false,
        message: `Failed to submit application to ${org.name} (Email)`,
        error: err?.response?.data || err.message
      };
    }
  }

  /**
   * Submits an application using SendGrid directly
   * @param application The mapped application data
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  private async submitViaSendGrid(
    application: Record<string, unknown>, 
    org: Organization
  ): Promise<SubmissionResponse> {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key is not configured (SENDGRID_API_KEY)');
    }

    // Check if SendGrid verified sender is configured
    const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
    if (!verifiedSender) {
      throw new Error('SendGrid verified sender is not configured (SENDGRID_VERIFIED_SENDER)');
    }

    try {
      // Format the application data for the email body
      let htmlBody = '';
      
      // Prepare attachments array for files
      const attachments: {content: string, filename: string, type: string, disposition: string}[] = [];
      
      // Organize application data by section
      const sections: Record<string, Array<{key: string, label: string, value: string}>> = {
        'Project Details': [],
        'Applicant Information': [],
        'References': [],
        'Other Information': []
      };
      
      // Common styling for the entire email
      const emailStyles = `
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f89b2b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #fff; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #eee; }
        .section { margin-bottom: 25px; }
        .section-title { color: #f89b2b; border-bottom: 2px solid #f89b2b; padding-bottom: 8px; margin-top: 20px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #555; margin-bottom: 5px; }
        .field-value { background-color: #f9f9f9; padding: 10px; border-radius: 4px; overflow-wrap: break-word; word-wrap: break-word; }
        .long-text { white-space: pre-wrap; max-height: 300px; overflow-y: auto; font-size: 14px; line-height: 1.5; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        em { color: #888; font-style: italic; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; overflow-x: auto; display: block; white-space: pre-wrap; }
        .org-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .org-badge { background-color: #f4f4f4; border-radius: 4px; padding: 5px 10px; display: inline-block; font-weight: bold; }
        .applied-orgs { background-color: #f0f8ff; padding: 12px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #4a90e2; }
      `;
      
      // Define strict categorization for fields - ensure no duplicates
      const sectionMappings: Record<string, string> = {
        // Project Details
        'project_name': 'Project Details',
        'project_description': 'Project Details',
        'main_focus': 'Project Details',
        'potential_impact': 'Project Details',
        'focus_area_description': 'Project Details',
        'grant_purpose': 'Project Details',
        'github': 'Project Details',
        'license': 'Project Details',
        'free_open_source': 'Project Details',
        'grant_proposal': 'Project Details',
        
        // Applicant Information
        'your_name': 'Applicant Information',
        'name': 'Applicant Information',
        'email': 'Applicant Information',
        'personal_github': 'Applicant Information',
        'twitter_handle': 'Applicant Information',
        'twitter': 'Applicant Information',
        'linkedin_profile': 'Applicant Information',
        'linkedin': 'Applicant Information',
        'personal_website': 'Applicant Information',
        'website': 'Applicant Information',
        'city': 'Applicant Information',
        'country': 'Applicant Information',
        'phone': 'Applicant Information',
        'technical_background': 'Applicant Information',
        'bitcoin_contributions': 'Applicant Information',
        'why_considered': 'Applicant Information',
        
        // References
        'references': 'References'
        
        // Everything else will go to Other Information
      };
      
      // Identify fields that should be displayed with special formatting for long text
      const longTextFields = [
        'project_description', 
        'technical_background', 
        'bitcoin_contributions', 
        'references',
        'potential_impact',
        'focus_area_description',
        'grant_purpose',
        'why_considered'
      ];
      
      // Process application data
      for (const [key, value] of Object.entries(application)) {
        // Skip internal flags and organization (handled separately)
        if (key === 'isSendingConfirmation' || key === 'organizations') continue;
        
        // Format the field name for display
        const fieldName = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        
        // Handle different value types
        let displayValue = '';
        
        // Handle file uploads
        if (key === 'grant_proposal' && value && typeof value === 'object' && 'buffer' in value) {
          // This is a file upload
          const file = value as any;
          if (file.buffer) {
            const base64Content = Buffer.from(file.buffer).toString('base64');
            attachments.push({
              content: base64Content,
              filename: file.originalname || 'grant-proposal.pdf',
              type: file.mimetype || 'application/pdf',
              disposition: 'attachment'
            });
            displayValue = `<em>File attached: ${file.originalname || 'grant-proposal.pdf'}</em>`;
          }
        } else if (value === null || value === undefined) {
          displayValue = '<em>Not provided</em>';
        } else if (typeof value === 'object') {
          displayValue = `<code>${JSON.stringify(value, null, 2)}</code>`;
        } else {
          // Format text fields appropriately based on length
          const stringValue = String(value);
          
          if (longTextFields.includes(key) && stringValue.length > 100) {
            // For long text fields, preserve whitespace and formatting
            displayValue = `<div class="long-text">${stringValue}</div>`;
          } else {
            displayValue = stringValue;
          }
        }
        
        // Determine which section this field belongs to
        const sectionName = sectionMappings[key] || 'Other Information';
        
        // Add field to the appropriate section
        sections[sectionName].push({ key, label: fieldName, value: displayValue });
      }
      
      // Get the list of all organizations the applicant applied to
      // Ensure organizations is always an array
      const organizationsField = application.organizations as string | string[] | undefined;
      const appliedOrgs = Array.isArray(organizationsField) 
        ? organizationsField 
        : organizationsField 
          ? [organizationsField.toString()]
          : [org.id];
      let appliedOrgsHtml = '';
      
      if (appliedOrgs && appliedOrgs.length > 0) {
        appliedOrgsHtml = `
          <div class="applied-orgs">
            <strong>Applied to Organizations:</strong>
            <div class="org-list">
              ${appliedOrgs.map(orgId => `<span class="org-badge">${orgId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>`).join('')}
            </div>
          </div>
        `;
      }
      
      // Build HTML body with sections
      htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Grant Application for ${org.name}</h1>
            </div>
            <div class="content">
              ${appliedOrgsHtml}
      `;
      
      // Add sections to HTML body
      Object.entries(sections).forEach(([sectionName, fields]) => {
        if (fields.length > 0) {
          htmlBody += `
            <div class="section">
              <h2 class="section-title">${sectionName}</h2>
          `;
          
          fields.forEach(({ label, value }) => {
            htmlBody += `
              <div class="field">
                <div class="field-label">${label}</div>
                <div class="field-value">${value}</div>
              </div>
            `;
          });
          
          htmlBody += `</div>`;
        }
      });
      
      // Close HTML body
      htmlBody += `
              <div class="footer">
                <p>This application was submitted via the Grant Application Platform.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send application details to organization recipients
      const orgMsg = {
        to: org.workflowConfig?.emailRecipients,
        from: verifiedSender,
        subject: org.workflowConfig?.emailSubject || `New Grant Application for ${org.name}`,
        html: htmlBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await sgMail.send(orgMsg);
      console.log(`Application details sent to ${org.name} recipients`);
      
      // Send confirmation email to applicant if email is provided and this is the first org
      // This is determined based on a flag that the controller will set
      const applicantEmail = application.email as string;
      const isSendingConfirmation = application.isSendingConfirmation as boolean;
      
      if (applicantEmail && isSendingConfirmation) {
        // Get all orgs the applicant applied to for the confirmation email
        const appliedOrgsList = appliedOrgs?.map(orgId => `<span class="org-badge">${orgId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>`).join('') || '';
        
        // Create organization buttons for each org the applicant applied to
        const orgButtons = appliedOrgs?.map(orgId => {
          const organization = organizations[orgId];
          if (organization && organization.website) {
            return `<a href="${organization.website}" class="button" style="margin-right: 10px; margin-bottom: 10px;">${organization.name}</a>`;
          }
          return '';
        }).join('') || '';
        
        const thankYouMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f89b2b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #fff; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #eee; }
            .message { margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
            .button { display: inline-block; background-color: #f89b2b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; margin-right: 10px; margin-bottom: 10px; }
            .org-list { display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0; }
            .org-badge { background-color: #f4f4f4; border-radius: 4px; padding: 5px 10px; display: inline-block; font-weight: bold; }
            .buttons-container { display: flex; flex-wrap: wrap; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Received</h1>
            </div>
            <div class="content">
              <div class="message">
                <p>Thank you for submitting your grant application to:</p>
                <div class="org-list">
                  ${appliedOrgsList}
                </div>
                
                <p>Your proposal has been received and will be reviewed by the organization(s). The review process typically takes 2-4 weeks depending on application volume. You'll be notified once a decision has been made or if additional information is needed.</p>
                
                <p>If you have any questions or need to update your application, please contact the organization(s) directly using the links below.</p>
              </div>
              
              <div class="buttons-container">
                ${orgButtons}
              </div>
              
              <div class="footer">
                <p>This is an automated message from the Bitcoin Grant Application Platform.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
        `;

        const applicantMsg = {
          to: applicantEmail,
          from: verifiedSender,
          subject: `Your Bitcoin Grant Application Has Been Successfully Submitted`,
          html: thankYouMessage,
        };

        await sgMail.send(applicantMsg);
        console.log(`Consolidated confirmation email sent to applicant: ${applicantEmail}`);
      }
      
      return {
        success: true,
        message: `Application submitted successfully to ${org.name} (Email via SendGrid)`,
        data: {}
      };
    } catch (error) {
      console.error(`Error sending ${org.name} emails via SendGrid:`, error);
      throw error;
    }
  }
} 