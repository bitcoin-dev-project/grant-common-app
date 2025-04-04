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
      const org = organizations[orgId];
      
      let response: SubmissionResponse;
      if (orgId === 'opensats') {
        response = await submitToOpenSats(data.application, org);
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
        const mainOrg = validOrgs[0];
        if (mainOrg && organizations[mainOrg]) {
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
  data?: unknown;
  error?: unknown;
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
      error: err?.response?.data || err.message
    }
  }
}

// Function to send confirmation emails
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

// We'll add more organization-specific submission functions as we expand 
// We'll add more organization-specific submission functions as we expand 