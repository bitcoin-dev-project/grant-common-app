import axios from 'axios';
import sgMail from '@sendgrid/mail';
import { Organization } from '../../config/organizations';
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
        'Additional Information': []
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
        .field-label { font-weight: bold; color: #555; }
        .field-value { background-color: #f9f9f9; padding: 10px; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        em { color: #888; font-style: italic; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        .org-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .org-badge { background-color: #f4f4f4; border-radius: 4px; padding: 5px 10px; display: inline-block; font-weight: bold; }
        .applied-orgs { background-color: #f0f8ff; padding: 12px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #4a90e2; }
      `;
      
      // Process application data
      for (const [key, value] of Object.entries(application)) {
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
          displayValue = String(value);
        }
        
        // Categorize fields into sections
        if (['project_name', 'project_description', 'main_focus', 'potential_impact', 'focus_area_description', 'grant_purpose', 'github', 'license', 'free_open_source', 'grant_proposal'].includes(key)) {
          sections['Project Details'].push({ key, label: fieldName, value: displayValue });
        } else if (['your_name', 'email', 'personal_github', 'twitter_handle', 'linkedin_profile', 'personal_website', 'city', 'country', 'phone', 'technical_background', 'bitcoin_contributions', 'why_considered'].includes(key)) {
          sections['Applicant Information'].push({ key, label: fieldName, value: displayValue });
        } else if (['references'].includes(key)) {
          sections['References'].push({ key, label: fieldName, value: displayValue });
        } else if (key !== 'organizations') { // Skip organizations for now, we'll handle it separately
          sections['Additional Information'].push({ key, label: fieldName, value: displayValue });
        }
      }
      
      // Get the list of all organizations the applicant applied to
      const appliedOrgs = application.organizations as string[] || [org.id];
      let appliedOrgsHtml = '';
      
      if (appliedOrgs && appliedOrgs.length > 0) {
        appliedOrgsHtml = `
          <div class="applied-orgs">
            <strong>Applied to Organizations:</strong>
            <div class="org-list">
              ${appliedOrgs.map(orgId => `<span class="org-badge">${orgId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>`).join('')}
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
        const appliedOrgsList = appliedOrgs?.map(orgId => `<span class="org-badge">${orgId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>`).join('') || '';
        
        const thankYouMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f89b2b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #fff; padding: 30px; border-radius: 0 0 5px 5px; border: 1px solid #eee; }
            .thank-you { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333; }
            .message { margin-bottom: 20px; }
            .org-name { color: #f89b2b; font-weight: bold; }
            .next-steps { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .next-steps-title { font-weight: bold; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
            .button { display: inline-block; background-color: #f89b2b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; }
            .org-list { display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0; }
            .org-badge { background-color: #f4f4f4; border-radius: 4px; padding: 5px 10px; display: inline-block; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Received</h1>
            </div>
            <div class="content">
              <div class="thank-you">Thank you for your application!</div>
              
              <div class="message">
                <p>We have received your grant application for the following organizations:</p>
                <div class="org-list">
                  ${appliedOrgsList}
                </div>
                <p>Your application details have been securely recorded in our system.</p>
              </div>
              
              <div class="next-steps">
                <div class="next-steps-title">What happens next?</div>
                <ul>
                  <li>Each organization's team will carefully review your application</li>
                  <li>You may be contacted for additional information if needed</li>
                  <li>You'll be notified about the status of your application as soon as decisions are made</li>
                </ul>
              </div>
              
              <p>If you have any questions in the meantime, please don't hesitate to reach out to us.</p>
              
              <a href="https://opensats.org" class="button">Visit OpenSats</a>
              
              <div class="footer">
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
        `;

        const applicantMsg = {
          to: applicantEmail,
          from: verifiedSender,
          subject: `Your Grant Application Has Been Received`,
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