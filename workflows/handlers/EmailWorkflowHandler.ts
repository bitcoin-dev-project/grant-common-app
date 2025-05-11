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
      
      // Create HTML content for the email - similar to OpenSats implementation
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
          displayValue = JSON.stringify(value, null, 2);
        } else {
          displayValue = String(value);
        }
        
        htmlBody += `<h3>${fieldName}</h3><p>${displayValue}</p>`;
      }

      // Send confirmation email to applicant if email is provided
      const applicantEmail = application.email as string;
      if (applicantEmail) {
        const thankYouMessage = `
          <p>Thank you for applying to ${org.name}!</p>
          <p>We have received your application and will evaluate it as quickly as we can.</p>
          <p>Feel free to reach out if you have any questions.</p>
          <p>We will contact you once we've made a decision.</p>
          <p>Thank you for your patience.</p>
        `;

        const applicantMsg = {
          to: applicantEmail,
          from: verifiedSender,
          subject: `Your Application to ${org.name}`,
          html: thankYouMessage,
        };

        await sgMail.send(applicantMsg);
        console.log(`Confirmation email sent to applicant: ${applicantEmail}`);
      }

      // Send application details to organization recipients
      const orgMsg = {
        to: org.workflowConfig?.emailRecipients,
        from: verifiedSender,
        subject: org.workflowConfig?.emailSubject || `New Grant Application for ${org.name}`,
        html: `<h2>New Grant Application for ${org.name}</h2>${htmlBody}`,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await sgMail.send(orgMsg);
      console.log(`Application details sent to ${org.name} recipients`);
      
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