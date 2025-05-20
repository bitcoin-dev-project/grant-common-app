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
      let formattedApplication: Record<string, unknown> = {};
      
      // Only include fields that are mapped for this organization or are common fields
      for (const [key, value] of Object.entries(mappedApplication)) {
        // Skip internal flags and file buffers that shouldn't be sent to the API
        if (key === 'isSendingConfirmation' || 
            (typeof value === 'object' && value !== null && 'buffer' in value)) {
          continue;
        }
        
        // Check if this field is mapped in the organization's fieldMapping
        const isMappedField = org.fieldMapping && (
          Object.keys(org.fieldMapping).includes(key) || // Field is a source in mapping
          Object.values(org.fieldMapping).includes(key)  // Field is a target in mapping
        );
        
        // Check if this is a common field that should be included
        const isCommonField = ['name', 'email', 'project_name', 'project_description', 'organizations'].includes(key);
        
        // Include only relevant fields
        if (isMappedField || isCommonField) {
          formattedApplication[key] = value;
        }
      }
      
      // Organization-specific transformations
      if (org.id === 'opensats') {
        formattedApplication.general_fund = true;
        
        // Ensure short_description is populated from project_description for API compatibility
        if (formattedApplication.project_description && !formattedApplication.short_description) {
          formattedApplication.short_description = formattedApplication.project_description;
        }
        
        // Handle other consolidated fields
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
      
      // Define strict field categorization - only include fields relevant to OpenSats
      const fieldCategories: Record<string, keyof typeof formattedSections> = {
        // Project details
        'project_name': 'projectDetails',
        'project_description': 'projectDetails',
        'short_description': 'projectDetails',
        'main_focus': 'projectDetails',
        'potential_impact': 'projectDetails',
        'github': 'projectDetails',
        'license': 'projectDetails',
        'free_open_source': 'projectDetails',
        'grant_proposal': 'projectDetails',
        'focus_area_description': 'projectDetails',
        'grant_purpose': 'projectDetails',
        
        // Applicant information
        'your_name': 'applicantInfo',
        'name': 'applicantInfo',
        'email': 'applicantInfo',
        'personal_github': 'applicantInfo',
        'twitter_handle': 'applicantInfo',
        'twitter': 'applicantInfo',
        'linkedin_profile': 'applicantInfo',
        'linkedin': 'applicantInfo',
        'personal_website': 'applicantInfo',
        'website': 'applicantInfo',
        'city': 'applicantInfo',
        'country': 'applicantInfo',
        'phone': 'applicantInfo',
        'technical_background': 'applicantInfo',
        'bitcoin_contributions': 'applicantInfo',
        'why_considered': 'applicantInfo',
        'interview_availability': 'applicantInfo'
        
        // Everything else goes to additionalInfo
      };
      
      // Process each field into the appropriate section
      Object.entries(application).forEach(([key, value]) => {
        // Skip internal flags, organizations, and fields not relevant to OpenSats
        if (key === 'isSendingConfirmation' || key === 'organizations' || 
            (typeof value === 'object' && value !== null && 'buffer' in value)) {
          return;
        }
        
        // Only include fields that are mapped for OpenSats or are in the field categories
        if (!fieldCategories[key] && !org.fieldMapping?.[key]) {
          return;
        }
        
        // Determine which section this field belongs to
        const category = fieldCategories[key] || 'additionalInfo';
        
        // Add to the appropriate section
        formattedSections[category][key] = value;
      });
      
      // Get the list of all organizations the applicant applied to
      const appliedOrgs = application.organizations as string[] || [org.id];
      
      // Create a simplified email data object with only OpenSats-relevant information
      const emailData = {
        name: application.name || application.your_name,
        email: application.email,
        project_name: application.project_name,
        project_description: application.project_description,
        formattedSections, // Add the organized sections with only OpenSats-relevant fields
        recipients: org.workflowConfig?.emailRecipients || [],
        subject: `New Grant Application for ${org.name}`,
        organization: org.name,
        emailTemplate: 'enhanced', // Signal to use the enhanced template
        isSendingConfirmation: application.isSendingConfirmation as boolean, // Keep this only for confirmation email logic
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