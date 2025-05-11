import { NextResponse } from 'next/server'
import organizations from '../../../config/organizations'
import { SubmissionService, SubmissionResponse } from '../../../workflows'

// Helper function to parse form data with files
async function parseFormData(request: Request): Promise<{ fields: Record<string, any>, files: Record<string, any> }> {
  const formData = await request.formData();
  const fields: Record<string, any> = {};
  const files: Record<string, any> = {};

  // Process each form field
  for (const [key, value] of formData.entries()) {
    // Check if it's a file by checking if it has arrayBuffer method and other file-like properties
    if (value && typeof value === 'object' && 'arrayBuffer' in value && 'type' in value && 'name' in value) {
      const buffer = Buffer.from(await (value as Blob).arrayBuffer());
      files[key] = {
        buffer,
        originalname: (value as any).name,
        mimetype: (value as any).type,
        size: (value as any).size,
      };
    } else {
      // Handle multiple values for the same key (like checkboxes)
      if (fields[key]) {
        if (!Array.isArray(fields[key])) {
          fields[key] = [fields[key]];
        }
        fields[key].push(value);
      } else {
        fields[key] = value;
      }
    }
  }

  return { fields, files };
}

export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const { fields, files } = await parseFormData(request);
    
    // Extract organizations from the form data
    const selectedOrgs = Array.isArray(fields.organizations) 
      ? fields.organizations 
      : fields.organizations ? [fields.organizations] : [];
    
    // Combine fields and files into a single application object
    const application = {
      ...fields,
      ...files,
    };
    
    // Validate the required fields
    if (!selectedOrgs || !selectedOrgs.length) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Get all valid organizations from the request
    const validOrgs = selectedOrgs.filter(orgId => {
      const org = organizations[orgId as string];
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
      const org = organizations[orgId as string];
      
      try {
        // Submit using the submission service
        const response = await SubmissionService.submitToOrganization(application, org);
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