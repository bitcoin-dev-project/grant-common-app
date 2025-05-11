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
} 