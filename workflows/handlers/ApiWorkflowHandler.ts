import axios from 'axios';
import { Organization } from '../../config/organizations';
import { WorkflowHandler, SubmissionResponse, mapFields } from '../WorkflowHandler';

/**
 * Handles submissions to API-based workflows
 */
export class ApiWorkflowHandler implements WorkflowHandler {
  /**
   * Formats application data specifically for OpenSats APIs
   * @param application The mapped application data
   * @returns A formatted application object with all required fields
   */
  private formatOpenSatsData(application: Record<string, unknown>): Record<string, unknown> {
    // Required fields for OpenSats application in the exact order
    const requiredOpenSatsFields = [
      'general_fund',
      'main_focus',
      'project_name',
      'short_description',
      'potential_impact',
      'website',
      'github',
      'free_open_source',
      'license',
      'duration',
      'timelines',
      'commitment',
      'proposed_budget',
      'has_received_funding',
      'what_funding',
      'your_name',
      'email',
      'are_you_lead',
      'other_lead',
      'personal_github',
      'other_contact',
      'references',
      'bios',
      'years_experience',
      'anything_else'
    ];
    
    // Create the formatted data object with all required fields
    const formattedData: Record<string, unknown> = {};
    
    // Add source field that identifies this as coming from the common grant app
    formattedData.source = 'common-grant-app';
    
    // Always set general_fund for OpenSats
    formattedData.general_fund = true;
    
    // Make sure all required fields have some value
    requiredOpenSatsFields.forEach(field => {
      // Skip general_fund as we've already set it
      if (field === 'general_fund') return;
      
      // Use the field from application, or empty string if missing
      if (field in application && application[field] !== undefined && application[field] !== null) {
        formattedData[field] = application[field];
      } else {
        // Add empty value for missing fields
        formattedData[field] = '';
      }
    });
    
    // Special handling for fields that need default values or transformations
    if (application.project_description && !formattedData.short_description) {
      formattedData.short_description = application.project_description;
    }
    
    if (application.existing_funding) {
      formattedData.what_funding = formattedData.what_funding || application.existing_funding;
      formattedData.has_received_funding = true;
    }
    
    // Ensure organizations is always an array if it exists
    if (application.organizations) {
      if (!Array.isArray(application.organizations)) {
        formattedData.organizations = [application.organizations];
      } else {
        formattedData.organizations = application.organizations;
      }
    }
    
    return formattedData;
  }

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
      
      // Format the data using the OpenSats formatter
      const formattedApplication = this.formatOpenSatsData(mappedApplication);

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

      // For OpenSats, also send to the SendGrid API URL
      if (org.id === 'opensats') {
        await this.sendToOpenSatsSendGrid(mappedApplication, org);
      }
      
      return {
        success: true,
        message: `Application submitted successfully to ${org.name}`,
        data: response.data
      };
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: unknown } };
      
      return {
        success: false,
        message: `Failed to submit application to ${org.name}`,
        error: err?.response?.data || err.message
      };
    }
  }

  /**
   * Sends application data to OpenSats SendGrid API
   * @param application The mapped application data
   * @param org The organization configuration
   */
  private async sendToOpenSatsSendGrid(
    application: Record<string, unknown>,
    org: Organization
  ): Promise<void> {
    const sendgridApiUrl = process.env.SENDGRID_API_URL;
    
    if (!sendgridApiUrl) {
      console.warn('SendGrid API URL is not configured (SENDGRID_API_URL). Skipping email notification.');
      return;
    }

    try {
      // Format the data for OpenSats SendGrid using the same formatter
      const formattedData = this.formatOpenSatsData(application);
      
      // Call the SendGrid endpoint
      const response = await axios.post(sendgridApiUrl, formattedData);
      
      if (response.data.message !== 'success') {
        console.warn(`OpenSats SendGrid API returned non-success: ${response.data.message}`);
      }
    } catch (error) {
      // Log error but don't fail the whole submission
      console.error('Error sending to OpenSats SendGrid API:', error);
    }
  }
} 