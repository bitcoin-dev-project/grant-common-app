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
  organization: string;
  application: Record<string, unknown>;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as ApplicationData
    
    // Validate the required fields
    if (!data.organization || !data.application) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const org = organizations[data.organization]
    
    // Check if the organization exists and is active
    if (!org || !org.active) {
      return NextResponse.json(
        { error: 'Organization not found or inactive' }, 
        { status: 404 }
      )
    }

    // Process the submission based on the organization
    let response
    
    if (data.organization === 'opensats') {
      response = await submitToOpenSats(data.application, org)
    } else {
      // Handle other organizations as we add them
      return NextResponse.json(
        { error: 'Organization handling not implemented' }, 
        { status: 501 }
      )
    }

    return NextResponse.json(response)
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

// We'll add more organization-specific submission functions as we expand 