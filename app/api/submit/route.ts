import { NextResponse } from 'next/server'
import axios from 'axios'
import organizations from '../../../config/organizations'
import { Organization } from '../../../config/organizations'

// Will store organization-specific API details in environment variables or a database
// const ORGS = {
//   opensats: {
//     name: 'OpenSats',
//     apiUrl: process.env.OPENSATS_API_URL || 'https://opensats.org/api/github',
//     apiKey: process.env.OPENSATS_API_KEY,
//     active: true
//   },
//   // Add more organizations here as we expand
//   // spiralbtc: {
//   //   name: 'Spiral',
//   //   apiUrl: '...',
//   //   apiKey: '...',
//   //   active: true  
//   // }
// }

// Define application type
interface ApplicationData {
  organizations: string[];
  application: Record<string, unknown>;
  [key: string]: unknown;
}

// Monday.com API specific interfaces
interface MondayAPIResponse {
  data?: Record<string, unknown>;
  error_message?: string;
  errors?: Array<Record<string, unknown>>;
  status_code?: number;
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as ApplicationData
    
    // Validate the required fields
    if (!data.organizations || !data.organizations.length || !data.application) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Get all valid organizations from the request
    const validOrgs = data.organizations.filter(orgId => {
      const org = organizations[orgId];
      return org && org.active && org.workflowImplemented === true;
    });
    
    // Check if there are any valid organizations
    if (validOrgs.length === 0) {
      return NextResponse.json(
        { error: 'No valid organizations selected' }, 
        { status: 400 }
      )
    }

    // Process the submission for each organization
    const results: Record<string, SubmissionResponse> = {};
    let overallSuccess = true;
    
    for (const orgId of validOrgs) {
      const orgConfig = organizations[orgId];
      
      let response: SubmissionResponse;
      if (orgId === 'opensats') {
        response = await submitToOpenSats(data.application, orgConfig);
      } else if (orgId === 'hrf') {
        response = await submitToHRF(data.application);
      } else {
        // For now, skip organizations that don't have implementations
        console.log(`Skipping ${orgId} - implementation not available`);
        continue;
      }
      
      results[orgId] = response;
      if (!response.success) {
        overallSuccess = false;
      }
    }

    // Send confirmation emails upon successful submission
    if (overallSuccess && data.application.email) {
      try {
        // Only send confirmation emails if OpenSats was one of the selected organizations
        if (validOrgs.includes('opensats') && results['opensats']?.success) {
          await sendConfirmationEmails(data.application);
        }
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
        // Still return success even if email sending fails
      }
    }

    if (Object.keys(results).length === 0) {
      return NextResponse.json(
        { error: 'No organizations processed' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Application submitted successfully' 
        : 'Some submissions failed',
      data: results
    });
  } catch (error) {
    console.error('Error processing submission:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error)?.message }, 
      { status: 500 }
    )
  }
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string | Record<string, unknown> | unknown;
}

async function submitToOpenSats(application: Record<string, unknown>, org: Organization): Promise<SubmissionResponse> {
  try {
    // Add/override fields that OpenSats expects
    const formattedApplication = {
      ...application,
      general_fund: true, // Default for OpenSats
    }

    console.log('Submitting to OpenSats API:', org.apiUrl)
    console.log('Application data:', JSON.stringify(formattedApplication, null, 2))

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENSATS_API_KEY}`
    }

    // Submit to OpenSats API
    if (!org.apiUrl) {
      throw new Error('API URL is not configured for this organization');
    }
    
    const response = await axios.post(org.apiUrl, formattedApplication, { headers })
    
    console.log('OpenSats API response:', response.data)
    
    return {
      success: true,
      message: 'Application submitted successfully to OpenSats',
      data: response.data
    }
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: unknown } }
    console.error('Error submitting to OpenSats:', err)
    console.error('Error details:', err?.response?.data || err.message)
    
    return {
      success: false,
      message: 'Failed to submit application to OpenSats',
      error: err?.response?.data || err.message || 'Unknown error'
    }
  }
}

async function submitToHRF(application: Record<string, unknown>): Promise<SubmissionResponse> {
  try {
    // Format application data for HRF's Monday.com board
    // HRF uses Monday.com for their grant management
    const mondayBoardId = process.env.HRF_MONDAY_BOARD_ID;
    const mondayApiKey = process.env.HRF_MONDAY_API_KEY;
    const mondayApiUrl = "https://api.monday.com/v2";

    if (!mondayBoardId || !mondayApiKey) {
      throw new Error('Monday.com configuration is missing for HRF');
    }

    // Map application data to the Monday.com form fields
    const projectName = application.project_name || "Unnamed Project";
    
    // Create column values using correct Monday.com data structures for each column type
    // See https://developer.monday.com/api-reference/docs/change-column-values
    
    // For dropdown columns, need to map values to IDs
    let openSourceValue = null;
    if (application.is_open_source === "Yes") {
      openSourceValue = 0; // Yes option ID
    } else if (application.is_open_source === "No") {
      openSourceValue = 2; // No option ID
    } else {
      openSourceValue = 1; // N/A option ID
    }
    
    // For pseudonym dropdown
    let pseudonymValue = null;
    if (application.pseudonym === "Yes") {
      pseudonymValue = 0; // Yes option ID
    } else if (application.pseudonym === "No") {
      pseudonymValue = 1; // No option ID
    }
    
    // For status columns, map to label IDs based on settings
    let focusValue = null;
    if (application.project_focus === "Bitcoin Core") {
      focusValue = 1; // Bitcoin Core ID
    } else if (application.project_focus === "Lightning Network") {
      focusValue = 0; // Lightning Network ID
    } else if (application.project_focus === "Nostr") {
      focusValue = 2; // Nostr ID
    }
    
    // Map column values using correct data structures for each type
    const columnValues = {
      // Name column - main item title
      name: projectName,
      
      // Status column for project focus area
      color_mkq725pz: focusValue !== null ? { index: focusValue } : null,
      
      // Text columns
      text_mkq77bjq: application.project_name || "",  // Project name
      text_mkq74qa2: application.short_description || "", // Short description
      text_mkq7mzqv: application.annual_budget || "", // Annual budget
      text_mkq71p0f: application.funding_amount || "", // Funding amount
      text_mkq72td6: application.email || "",         // Email
      
      // Long text columns
      long_text_mkq7dqak: application.name || "",     // Applicant name
      long_text_mkq7a1wg: application.detailed_description || "", // Detailed description
      long_text_mkq7mqqe: application.hrf_mission_relation || "", // HRF mission relation
      long_text_mkq7b6rj: application.why_fund || "", // Why fund
      long_text_mkq7ebhb: application.measure_success || "", // Measure success
      long_text_mkq7za4z: application.project_links || "", // Project links
      long_text_mkq7q8kk: application.funding_usage || "", // Funding usage
      long_text_mkq7va7c: application.prior_funding || "", // Prior funding
      long_text_mkq7rr6a: application.social_media || "", // Social media
      long_text_mkq7k1y0: application.references || "", // References
      long_text_mkq72zet: application.additional_info || "", // Additional info
      
      // Dropdown columns
      dropdown_mkq7enwh: openSourceValue !== null ? { ids: [openSourceValue] } : null, // Open source
      dropdown_mkq71g5h: pseudonymValue !== null ? { ids: [pseudonymValue] } : null // Pseudonym
    };
    
    // GraphQL mutation to create a new item on Monday.com board
    const mutation = `
      mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item (
          board_id: $boardId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
        }
      }
    `;

    const variables = {
      boardId: mondayBoardId,
      itemName: projectName,
      columnValues: JSON.stringify(columnValues)
    };

    console.log('Submitting to Monday.com with variables:', variables);

    // Make the API request to Monday.com
    const response = await axios.post<MondayAPIResponse>(
      mondayApiUrl,
      { query: mutation, variables: variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': mondayApiKey
        }
      }
    );

    const mondayResponse = response.data as Record<string, unknown>;

    if (mondayResponse.errors) {
      throw new Error(`Monday.com API error: ${JSON.stringify(mondayResponse.errors)}`);
    }

    console.log('Monday.com API response for HRF:', mondayResponse);
    
    return {
      success: true,
      message: 'Application submitted successfully to HRF',
      data: mondayResponse
    };
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: unknown } };
    console.error('Error submitting to HRF:', err);
    console.error('Error details:', err?.response?.data || err.message);
    
    return {
      success: false,
      message: 'Failed to submit application to HRF',
      error: err?.response?.data || err.message || 'Unknown error'
    };
  }
}

async function sendConfirmationEmails(application: Record<string, unknown>): Promise<void> {
  const applicantEmail = application.email as string
  
  if (!applicantEmail) {
    throw new Error('Applicant email is required');
  }
  
  // Get SendGrid API URL from environment variables
  const sendgridApiUrl = process.env.SENDGRID_API_URL
  
  if (!sendgridApiUrl) {
    throw new Error('SendGrid API URL is not configured (SENDGRID_API_URL)')
  }
  
  try {
    // Format application data for the website app's SendGrid endpoint
    // The website app expects the full application data without special formatting
    const emailData = {
      ...application,
      // Add any fields expected by the website app's SendGrid endpoint
      project_name: application.project_name,
      email: applicantEmail
    }
    
    console.log('Sending application to SendGrid API:', sendgridApiUrl)
    
    // Call the website app's SendGrid endpoint
    const response = await axios.post(sendgridApiUrl, emailData)
    
    console.log('SendGrid API response:', response.data)
    
    if (response.data.message !== 'success') {
      throw new Error(`SendGrid API returned error: ${response.data.message}`)
    }
  } catch (error) {
    console.error('Error sending emails via SendGrid API:', error)
    throw error
  }
} 