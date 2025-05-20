import axios from 'axios';
import { Organization } from '../../config/organizations';
import { WorkflowHandler, SubmissionResponse, mapFields } from '../WorkflowHandler';

/**
 * Handles submissions to Google Form-based workflows
 */
export class GoogleFormWorkflowHandler implements WorkflowHandler {
  /**
   * Submits an application to an organization using their Google Form
   * @param application The application data to submit
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  async submit(application: Record<string, unknown>, org: Organization): Promise<SubmissionResponse> {
    try {
      if (!org.workflowConfig?.formUrl) {
        throw new Error('Google Form URL is not configured for this organization');
      }

      if (!org.workflowConfig?.formFields || Object.keys(org.workflowConfig.formFields).length === 0) {
        throw new Error('Google Form fields are not configured for this organization');
      }

      // Apply field mapping if available
      const mappedApplication = mapFields(application, org.fieldMapping || {});
      
      // Filter to only include fields relevant to this organization
      const relevantApplication: Record<string, unknown> = {};
      
      // Only include fields that are explicitly mapped in formFields or are common fields
      for (const [key, value] of Object.entries(mappedApplication)) {
        // Skip internal flags and file buffers
        if (key === 'isSendingConfirmation' || 
            (typeof value === 'object' && value !== null && 'buffer' in value)) {
          continue;
        }
        
        // Check if this field is used in the form fields mapping
        const isFormField = Object.keys(org.workflowConfig.formFields).includes(key);
        
        // Check if this is a common field that should be included
        const isCommonField = ['name', 'email', 'project_name', 'project_description'].includes(key);
        
        // Include only relevant fields
        if (isFormField || isCommonField) {
          relevantApplication[key] = value;
        }
      }
      
      // Special handling for date of birth if it exists
      if (relevantApplication.date_of_birth && typeof relevantApplication.date_of_birth === 'string') {
        try {
          const dateObj = new Date(relevantApplication.date_of_birth as string);
          if (!isNaN(dateObj.getTime())) {
            // Add individual date components
            relevantApplication.date_of_birth_year = dateObj.getFullYear().toString();
            relevantApplication.date_of_birth_month = (dateObj.getMonth() + 1).toString();
            relevantApplication.date_of_birth_day = dateObj.getDate().toString();
          }
        } catch (e) {
          console.error('Error parsing date of birth:', e);
        }
      }
      
      // Create form data from mapped fields
      const formData = new URLSearchParams();
      const formFields = org.workflowConfig.formFields;
      
      // Add each field to the form data
      for (const [appField, formField] of Object.entries(formFields)) {
        // Get value from application data, using mapped field if available
        let value = String(relevantApplication[appField] || '');
        
        if (value) {
          formData.append(formField, value);
        }
      }

      const formUrl = org.workflowConfig.formUrl;
      
      console.log(`Submitting to ${org.name} Google Form:`, formUrl);
      console.log('Form data:', Object.fromEntries(formData.entries()));
      
      // Submit to Google Form
      const axiosResponse = await axios.post(formUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0, // Google Form may redirect on success
        validateStatus: (status) => status === 200 || status === 302,
      });

      console.log(`${org.name} Google Form response status:`, axiosResponse.status);
      
      return {
        success: true,
        message: `Application submitted successfully to ${org.name} (Google Form)`,
        data: {}
      };
    } catch (error: unknown) {
      const err = error as Error & { 
        response?: { 
          status?: number;
          statusText?: string;
          data?: unknown;
        } 
      };
      console.error(`Error submitting to ${org.name} Google Form:`, err);
      if (err.response) {
        console.error(`${org.name} Google Form error response:`, {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      }
      
      return {
        success: false,
        message: `Failed to submit application to ${org.name} (Google Form)`,
        error: err?.response?.data || err.message
      };
    }
  }
} 