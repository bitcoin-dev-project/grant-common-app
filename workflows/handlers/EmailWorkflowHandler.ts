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
      
      // Process each field into a section
      for (const [key, value] of Object.entries(application)) {
        // Skip internal flags and organizations array, but NOT files
        if (key === 'isSendingConfirmation' || key === 'organizations') {
          continue;
        }
        
        // Only include fields that are mapped for this organization or are common fields
        // Check if this field is mapped in the organization's fieldMapping
        const isMappedField = org.fieldMapping && (
          Object.keys(org.fieldMapping).includes(key) || // Field is a source in mapping
          Object.values(org.fieldMapping).includes(key)  // Field is a target in mapping
        );
        
        // Check if this is a common field that should be included
        const isCommonField = ['name', 'email', 'project_name', 'project_description', 'grant_proposal'].includes(key);
        
        // Skip fields not relevant to this organization
        if (!isMappedField && !isCommonField && !sectionMappings[key]) {
          continue;
        }
        
        // Format the field label
        let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Format the field value
        let formattedValue = '';
        
        if (value === null || value === undefined) {
          formattedValue = 'Not provided';
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'Yes' : 'No';
        } else if (Array.isArray(value)) {
          formattedValue = value.join(', ');
        } else if (typeof value === 'object' && 'buffer' in value) {
          // This is a file, handle it separately
          const file = value as { buffer: Buffer, originalname: string, mimetype: string };
          
          // Add to attachments
          attachments.push({
            content: file.buffer.toString('base64'),
            filename: file.originalname,
            type: file.mimetype,
            disposition: 'attachment'
          });
          
          formattedValue = `File attached: ${file.originalname}`;
        } else {
          formattedValue = String(value);
        }
        
        // Determine which section this field belongs to
        const section = sectionMappings[key] || 'Other Information';
        
        // Add to the appropriate section
        sections[section].push({
          key,
          label,
          value: formattedValue
        });
      }
      
      // Start building HTML email
      htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .container {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .header {
            background-color: #0052cc;
            color: white;
            padding: 10px 20px;
            border-radius: 5px 5px 0 0;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .section-title {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-top: 0;
            color: #0052cc;
          }
          .field {
            margin-bottom: 15px;
          }
          .field-label {
            font-weight: bold;
            margin-bottom: 5px;
            display: block;
          }
          .field-value {
            margin: 0;
          }
          .long-text {
            white-space: pre-wrap;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 3px;
            border-left: 3px solid #ddd;
          }
          .footer {
            margin-top: 20px;
            font-size: 0.9em;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Grant Application for ${org.name}</h2>
          </div>
          
          <div class="content">
      `;
      
      // Add each section to the email body
      for (const [sectionName, fields] of Object.entries(sections)) {
        // Skip empty sections
        if (fields.length === 0) continue;
        
        htmlBody += `
            <div class="section">
              <h3 class="section-title">${sectionName}</h3>
        `;
        
        // Add each field in the section
        for (const field of fields) {
          const isLongText = longTextFields.includes(field.key) && field.value.length > 100;
          
          htmlBody += `
              <div class="field">
                <div class="field-label">${field.label}:</div>
                <div class="field-value ${isLongText ? 'long-text' : ''}">
                  ${field.value}
                </div>
              </div>
          `;
        }
        
        htmlBody += `
            </div>
        `;
      }
      
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
        // Get list of all orgs the applicant applied to
        const appliedOrgs = application.organizations as string[] || [org.id];
        
        // Create list items for each org
        let appliedOrgsList = '';
        let orgButtons = '';
        
        for (const orgId of appliedOrgs) {
          if (organizations[orgId]) {
            const orgInfo = organizations[orgId];
            appliedOrgsList += `<li>${orgInfo.name}</li>`;
            orgButtons += `
              <a href="${orgInfo.website}" style="display: inline-block; margin: 10px; padding: 10px 15px; background-color: #0052cc; color: white; text-decoration: none; border-radius: 5px;">
                ${orgInfo.name} Website
              </a>
            `;
          }
        }
        
        // Create thank you message
        const thankYouMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
            .container {
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .header {
              background-color: #0052cc;
              color: white;
              padding: 10px 20px;
              border-radius: 5px 5px 0 0;
              margin-bottom: 20px;
              text-align: center;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .org-list {
              margin: 20px 0;
            }
            .buttons-container {
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              margin-top: 20px;
              font-size: 0.9em;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Your Bitcoin Grant Application Has Been Successfully Submitted</h2>
            </div>
            
            <div class="content">
              <p>Thank you for submitting your grant application to the following organization(s):</p>
              
              <div class="org-list">
                <ul>
                ${appliedOrgsList}
                </ul>
                
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