import { Organization } from '../config/organizations';
import { SubmissionResponse } from './WorkflowHandler';
import { WorkflowFactory } from './WorkflowFactory';

/**
 * Service for handling application submissions
 */
export class SubmissionService {
  /**
   * Submit an application to an organization
   * @param application The application data to submit
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  static async submitToOrganization(
    application: Record<string, unknown>,
    org: Organization
  ): Promise<SubmissionResponse> {
    try {
      // Get the appropriate workflow handler
      const workflowType = org.workflowType || 'api';
      const handler = WorkflowFactory.getHandler(workflowType);

      if (!handler) {
        return {
          success: false,
          message: `No handler available for ${org.name} (workflow type: ${workflowType})`,
          error: 'Workflow handler not implemented'
        };
      }

      // Submit the application using the appropriate handler
      return await handler.submit(application, org);
    } catch (error) {
      console.error(`Error in submission service for ${org.name}:`, error);
      return {
        success: false,
        message: `Failed to process submission for ${org.name}`,
        error: (error as Error)?.message || 'Unknown error'
      };
    }
  }

  /**
   * Send confirmation emails to the applicant
   * @param application The application data
   * @returns A promise that resolves when emails are sent
   */
  static async sendConfirmationEmails(application: Record<string, unknown>): Promise<void> {
    const applicantEmail = application.email as string;
    
    if (!applicantEmail) {
      throw new Error('Applicant email is required');
    }
    
    // Get SendGrid API URL from environment variables
    const sendgridApiUrl = process.env.SENDGRID_API_URL;
    
    if (!sendgridApiUrl) {
      throw new Error('SendGrid API URL is not configured (SENDGRID_API_URL)');
    }
    
    try {
      // Use the EmailWorkflowHandler for sending confirmation emails
      const emailHandler = WorkflowFactory.getHandler('email');
      
      if (!emailHandler) {
        throw new Error('Email workflow handler not available');
      }
      
      // Create a mock organization for sending the confirmation email
      const confirmationOrg: Organization = {
        id: 'confirmation',
        name: 'Confirmation Email',
        description: 'Confirmation Email Service',
        website: '',
        active: true,
        workflowType: 'email',
        workflowConfig: {
          emailRecipients: [applicantEmail],
          emailSubject: 'Your Grant Application Has Been Submitted'
        }
      };
      
      const response = await emailHandler.submit(application, confirmationOrg);
      
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error sending confirmation emails:', error);
      throw error;
    }
  }
} 