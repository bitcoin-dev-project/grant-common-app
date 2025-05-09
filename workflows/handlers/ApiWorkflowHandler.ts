import axios from 'axios';
import { Organization } from '../../config/organizations';
import { WorkflowHandler, SubmissionResponse, mapFields } from '../WorkflowHandler';

/**
 * Handles submissions to API-based workflows
 */
export class ApiWorkflowHandler implements WorkflowHandler {
  /**
   * Submits an application to an organization using their API
   * @param application The application data to submit
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  async submit(application: Record<string, unknown>, org: Organization): Promise<SubmissionResponse> {
    try {
      if (!org.apiUrl) {
        throw new Error('API URL is not configured for this organization');
      }

      // Apply field mapping if available
      const mappedApplication = mapFields(application, org.fieldMapping || {});
      
      // Add any organization-specific transformations
      let formattedApplication = { ...mappedApplication };
      
      // Organization-specific transformations
      if (org.id === 'opensats') {
        formattedApplication.general_fund = true;
      }

      console.log(`Submitting to ${org.name} API:`, org.apiUrl);
      console.log('Application data:', JSON.stringify(formattedApplication, null, 2));

      // Get headers from config or use defaults
      const headers = org.workflowConfig?.apiHeaders || {
        'Content-Type': 'application/json'
      };

      // Add authorization if needed but not in config
      if (org.id === 'opensats' && !headers.Authorization) {
        headers.Authorization = `Bearer ${process.env.OPENSATS_API_KEY}`;
      }

      // Submit to API
      const method = org.workflowConfig?.apiMethod || 'POST';
      const response = await axios({
        method,
        url: org.apiUrl,
        data: formattedApplication,
        headers
      });
      
      console.log(`${org.name} API response:`, response.data);
      
      return {
        success: true,
        message: `Application submitted successfully to ${org.name}`,
        data: response.data
      };
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: unknown } };
      console.error(`Error submitting to ${org.name}:`, err);
      console.error('Error details:', err?.response?.data || err.message);
      
      return {
        success: false,
        message: `Failed to submit application to ${org.name}`,
        error: err?.response?.data || err.message
      };
    }
  }
} 