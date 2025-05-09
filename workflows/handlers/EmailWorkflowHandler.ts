import axios from 'axios';
import { Organization } from '../../config/organizations';
import { WorkflowHandler, SubmissionResponse, mapFields } from '../WorkflowHandler';

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
      
      // For now, use SendGrid API for all email-based workflows
      const sendgridApiUrl = process.env.SENDGRID_API_URL;
      
      if (!sendgridApiUrl) {
        throw new Error('SendGrid API URL is not configured (SENDGRID_API_URL)');
      }
      
      // Format email data
      const emailData = {
        ...mappedApplication,
        recipients: org.workflowConfig.emailRecipients,
        subject: org.workflowConfig.emailSubject || `New Grant Application for ${org.name}`,
        organization: org.name
      };
      
      console.log(`Sending ${org.name} application via email:`, org.workflowConfig.emailRecipients);
      
      // Call SendGrid API
      const response = await axios.post(sendgridApiUrl, emailData);
      
      console.log(`${org.name} email response:`, response.data);
      
      if (response.data.message !== 'success') {
        throw new Error(`SendGrid API returned error: ${response.data.message}`);
      }
      
      return {
        success: true,
        message: `Application submitted successfully to ${org.name} (Email)`,
        data: {}
      };
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
} 