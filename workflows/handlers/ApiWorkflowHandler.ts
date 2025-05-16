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
        
        // Ensure short_description is populated from project_description for API compatibility
        if (formattedApplication.project_description && !formattedApplication.short_description) {
          formattedApplication.short_description = formattedApplication.project_description;
        }
        
        // Handle other consolidated fields
        if (formattedApplication.additional_info) {
          // Populate fields that were consolidated into additional_info
          formattedApplication.bios = formattedApplication.bios || formattedApplication.additional_info;
          formattedApplication.anything_else = formattedApplication.anything_else || formattedApplication.additional_info;
        }
        
        // Handle consolidated funding fields
        if (formattedApplication.existing_funding) {
          formattedApplication.what_funding = formattedApplication.what_funding || formattedApplication.existing_funding;
          formattedApplication.has_received_funding = true;
        }
      } else if (org.id === 'maelstrom') {
        // Handle consolidated references field for Maelstrom
        if (formattedApplication.references && typeof formattedApplication.references === 'string') {
          // Try to extract the first reference's name and email
          const referenceText = formattedApplication.references as string;
          const referenceMatch = referenceText.match(/([^,]+),\s*([^,\s]+@[^,\s]+)/);
          
          if (referenceMatch) {
            formattedApplication.reference_name = referenceMatch[1].trim();
            formattedApplication.reference_email = referenceMatch[2].trim();
          }
        }
        
        // Handle address fields for Maelstrom
        // The residential_address field is already mapped in the organization config
        
        // Always use country value for citizenship_country field for Maelstrom
        if (formattedApplication.country) {
          formattedApplication.citizenship_country = formattedApplication.country;
        }
      }

      // Ensure organizations is always an array
      if (formattedApplication.organizations && !Array.isArray(formattedApplication.organizations)) {
        formattedApplication.organizations = [formattedApplication.organizations];
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
      console.error(`Error submitting to ${org.name}:`, err);
      console.error('Error details:', err?.response?.data || err.message);
      
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
      // Format application data into sections for better email presentation
      const formattedSections: {
        projectDetails: Record<string, unknown>;
        applicantInfo: Record<string, unknown>;
        additionalInfo: Record<string, unknown>;
      } = {
        projectDetails: {},
        applicantInfo: {},
        additionalInfo: {}
      };
      
      // Categorize fields into sections
      Object.entries(application).forEach(([key, value]) => {
        if (['project_name', 'project_description', 'short_description', 'main_focus', 'potential_impact', 'github', 'license'].includes(key)) {
          formattedSections.projectDetails[key] = value;
        } else if (['your_name', 'email', 'personal_github', 'twitter_handle', 'linkedin_profile', 'personal_website'].includes(key)) {
          formattedSections.applicantInfo[key] = value;
        } else {
          formattedSections.additionalInfo[key] = value;
        }
      });
      
      // Get the list of all organizations the applicant applied to
      const appliedOrgs = application.organizations as string[] || [org.id];
      
      // Format email data for OpenSats SendGrid API
      const emailData = {
        ...application,
        formattedSections, // Add the organized sections
        recipients: org.workflowConfig?.emailRecipients || [],
        subject: `New Grant Application for ${org.name}`,
        organization: org.name,
        emailTemplate: 'enhanced', // Signal to use the enhanced template
        isSendingConfirmation: application.isSendingConfirmation, // Pass along the flag for confirmation email
        appliedOrganizations: appliedOrgs // Pass all orgs the applicant applied to
      };
      
      console.log(`Sending ${org.name} application via SendGrid API:`, sendgridApiUrl);
      
      // Call OpenSats SendGrid API
      const response = await axios.post(sendgridApiUrl, emailData);
      
      console.log(`${org.name} SendGrid API response:`, response.data);
      
      if (response.data.message !== 'success') {
        console.warn(`OpenSats SendGrid API returned non-success: ${response.data.message}`);
      }
    } catch (error) {
      // Log error but don't fail the whole submission
      console.error('Error sending to OpenSats SendGrid API:', error);
    }
  }
} 