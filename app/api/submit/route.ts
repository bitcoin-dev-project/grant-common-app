import { NextResponse } from 'next/server'
import organizations from '../../../config/organizations'
import { SubmissionService, SubmissionResponse } from '../../../workflows'

// Helper function to verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    return { success: false, error: 'reCAPTCHA secret key not configured' };
  }
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    
    // For reCAPTCHA v2, just check if verification was successful
    if (data.success) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ') || 'Unknown error'}` 
      };
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Failed to verify reCAPTCHA' };
  }
}

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
      // Special handling for known array fields
      if (key === 'organizations') {
        if (fields[key]) {
          if (!Array.isArray(fields[key])) {
            fields[key] = [fields[key]];
          }
          fields[key].push(value);
        } else {
          // Initialize as array for known array fields
          fields[key] = [value];
        }
      } 
      // Handle multiple values for the same key (like checkboxes)
      else if (fields[key]) {
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
    
    // Verify reCAPTCHA token
    const recaptchaToken = fields.recaptchaToken;
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA token missing' }, 
        { status: 400 }
      );
    }
    
    const recaptchaVerification = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaVerification.success) {
      return NextResponse.json(
        { error: recaptchaVerification.error || 'reCAPTCHA verification failed' }, 
        { status: 400 }
      );
    }
    
    console.log(`reCAPTCHA verification successful.`);
    
    // Extract organizations from the form data
    const selectedOrgs = Array.isArray(fields.organizations) 
      ? fields.organizations 
      : fields.organizations ? [fields.organizations] : [];
    
    // Combine fields and files into a single application object
    // Remove the recaptchaToken from the application data since it's not needed for submission
    const applicationFields = { ...fields };
    delete applicationFields.recaptchaToken;
    const application = {
      ...applicationFields,
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
    
    // Process each organization, but only send confirmation email for the first one
    for (let i = 0; i < validOrgs.length; i++) {
      const orgId = validOrgs[i];
      const org = organizations[orgId as string];
      
      try {
        // Create a copy of the application data with a flag for the first org only
        const applicationWithFlag = {
          ...application,
          // Only set isSendingConfirmation to true for the first org
          isSendingConfirmation: i === 0,
          // Always include the full list of valid organizations for the confirmation email
          organizations: validOrgs
        };
        
        // Submit using the submission service
        const response = await SubmissionService.submitToOrganization(applicationWithFlag, org);
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