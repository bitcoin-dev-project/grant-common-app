import { NextResponse } from 'next/server'
import organizations from '../../../config/organizations'
import { SubmissionService, SubmissionResponse } from '../../../workflows'

// Define application type
interface ApplicationData {
  organizations: string[];
  application: Record<string, unknown>;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as ApplicationData;
    
    // Validate the required fields
    if (!data.organizations || !data.organizations.length || !data.application) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
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
      );
    }

    // Process the submission for each organization
    const results: Record<string, SubmissionResponse> = {};
    let overallSuccess = true;
    
    for (const orgId of validOrgs) {
      const org = organizations[orgId];
      
      try {
        // Submit using the submission service
        const response = await SubmissionService.submitToOrganization(data.application, org);
        results[orgId] = response;
        
        if (!response.success) {
          overallSuccess = false;
        }
      } catch (error) {
        console.error(`Error processing ${orgId} submission:`, error);
        results[orgId] = {
          success: false,
          message: `Failed to process submission for ${org.name}`,
          error: (error as Error)?.message || 'Unknown error'
        };
        overallSuccess = false;
      }
    }

    // Send confirmation emails upon successful submission
    if (overallSuccess && data.application.email) {
      try {
        await SubmissionService.sendConfirmationEmails(data.application);
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
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error)?.message }, 
      { status: 500 }
    );
  }
} 