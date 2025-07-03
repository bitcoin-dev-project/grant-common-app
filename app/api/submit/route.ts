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
  console.log(`🚀 === NEW APPLICATION SUBMISSION STARTED ===`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Parse the multipart form data
    console.log(`📥 Parsing form data...`);
    const { fields, files } = await parseFormData(request);
    
    // Log form data overview
    const fieldsSize = JSON.stringify(fields).length;
    const filesCount = Object.keys(files).length;
    let totalFileSize = 0;
    
         for (const [, fileData] of Object.entries(files)) {
       if (fileData && typeof fileData === 'object' && 'size' in fileData) {
         totalFileSize += (fileData as any).size;
       }
     }
    
    console.log(`📊 Form Data Overview:`);
    console.log(`   Fields: ${Object.keys(fields).length} fields (${(fieldsSize / 1024).toFixed(1)}KB)`);
    console.log(`   Files: ${filesCount} files (${(totalFileSize / 1024 / 1024).toFixed(2)}MB total)`);
    
    if (filesCount > 0) {
      console.log(`   File Details:`);
             for (const [, fileData] of Object.entries(files)) {
         if (fileData && typeof fileData === 'object' && 'originalname' in fileData && 'size' in fileData) {
           const file = fileData as any;
           console.log(`     - ${file.originalname}: ${(file.size / 1024).toFixed(1)}KB (${file.mimetype})`);
         }
       }
    }
    
    // Verify reCAPTCHA token
    const recaptchaToken = fields.recaptchaToken;
    if (!recaptchaToken) {
      console.error(`❌ reCAPTCHA token missing`);
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

    // Process all organizations in parallel for better performance
    const results: Record<string, SubmissionResponse & { duration: number; completedAt: number }> = {};
    let overallSuccess = true;
    
    console.log(`🚀 Starting parallel submission to ${validOrgs.length} organizations...`);
    const globalStartTime = Date.now();
    
    // Create submission promises for all organizations
    const submissionPromises = validOrgs.map(async (orgId, index) => {
      const org = organizations[orgId as string];
      const startTime = Date.now();
      
      console.log(`🎯 Starting submission ${index + 1}/${validOrgs.length}: ${org.name} (${org.workflowType})`);
      
      try {
        const applicationWithFlag = {
          ...application,
          // Never send confirmation email during individual org submissions
          isSendingConfirmation: false,
          // Include the full list of valid organizations for reference
          organizations: validOrgs
        };
        
        // Add timeout to individual submissions (30 seconds per organization)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Organization submission timeout - taking too long to respond')), 30000);
        });
        
        const submissionPromise = SubmissionService.submitToOrganization(applicationWithFlag, org);
        
        const response = await Promise.race([submissionPromise, timeoutPromise]);
        
        const duration = Date.now() - startTime;
        const completedAt = Date.now() - globalStartTime; // Time since all submissions started
        
        console.log(`✅ Submission to ${org.name} completed in ${duration}ms (${completedAt}ms from start): ${response.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (!response.success) {
          console.error(`❌ Submission failed for ${org.name}: ${response.message}`);
          if (response.error) {
            console.error(`   Error details:`, response.error);
          }
        }
        
        return {
          orgId,
          result: {
            ...response,
            duration,
            completedAt
          }
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const completedAt = Date.now() - globalStartTime;
        
        console.error(`❌ Error processing ${orgId} submission:`, error);
        
        // Log more specific error details
        if (error instanceof Error) {
          console.error(`   Error Type: ${error.constructor.name}`);
          console.error(`   Error Message: ${error.message}`);
          if (error.stack) {
            console.error(`   Stack Trace:`, error.stack);
          }
        }
        
        return {
          orgId,
          result: {
            success: false,
            message: `Failed to process submission for ${org.name}`,
            error: (error as Error)?.message || 'Unknown error',
            duration,
            completedAt
          }
        };
      }
    });
    
    // Wait for all submissions to complete
    const submissionResults = await Promise.allSettled(submissionPromises);
    
    // Process results
    submissionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { orgId, result: orgResult } = result.value;
        results[orgId] = orgResult;
        
        if (!orgResult.success) {
          overallSuccess = false;
        }
      } else {
        // This should rarely happen since we handle errors inside the promise
        const orgId = validOrgs[index];
        const org = organizations[orgId as string];
        
        console.error(`❌ Promise rejected for ${org.name}:`, result.reason);
        
        results[orgId] = {
          success: false,
          message: `Promise rejection: ${org.name}`,
          error: result.reason?.message || 'Promise rejected',
          duration: 30000, // Assume timeout
          completedAt: Date.now() - globalStartTime
        };
        overallSuccess = false;
      }
    });
    
    const totalDuration = Date.now() - globalStartTime;
    console.log(`🏁 All ${validOrgs.length} submissions completed in ${totalDuration}ms (parallel processing)`)

    if (Object.keys(results).length === 0) {
      return NextResponse.json(
        { error: 'No organizations processed' }, 
        { status: 500 }
      );
    }

    // Calculate submission summary
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    const failedCount = totalCount - successCount;
    
    // Send confirmation email after all submissions are complete
    const applicantEmail = application.email as string;
    if (applicantEmail && successCount > 0) {
      console.log(`📧 Sending final confirmation email to: ${applicantEmail}`);
      console.log(`   Successful submissions: ${successCount}/${totalCount}`);
      
      try {
        // Get list of successful organizations only
        const successfulOrgs = Object.entries(results)
          .filter(([, result]) => result.success)
          .map(([orgId]) => orgId);
        
        // Send confirmation email with successful organizations
        const confirmationApplication = {
          ...application,
          isSendingConfirmation: true,
          organizations: successfulOrgs,
          submissionSummary: {
            total: totalCount,
            successful: successCount,
            failed: failedCount,
            results: results
          }
        };
        
        // Use the EmailWorkflowHandler to send confirmation
        const { EmailWorkflowHandler } = await import('../../../workflows/handlers/EmailWorkflowHandler');
        const emailHandler = new EmailWorkflowHandler();
        
        // Create a dummy organization config for confirmation email
        const confirmationOrg = {
          id: 'confirmation',
          name: 'Confirmation Service',
          description: 'Internal confirmation service',
          website: '',
          active: true,
          workflowType: 'email' as const,
          workflowConfig: {
            emailRecipients: [applicantEmail]
          }
        };
        
        // Send confirmation email using the existing submit method
        await emailHandler.submit(confirmationApplication, confirmationOrg);
        console.log(`✅ Final confirmation email sent successfully`);
      } catch (error) {
        console.error(`❌ Failed to send final confirmation email:`, error);
        // Don't fail the entire submission if confirmation email fails
      }
    }

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Application submitted successfully to all organizations' 
        : successCount > 0
          ? `Application submitted to ${successCount} of ${totalCount} organizations`
          : 'All submissions failed',
      data: results,
      submissionSummary: {
        total: totalCount,
        successful: successCount,
        failed: failedCount,
        isPartialSuccess: successCount > 0 && successCount < totalCount,
        organizationResults: Object.entries(results).map(([orgId, result]) => ({
          organizationId: orgId,
          organizationName: organizations[orgId as string]?.name || orgId,
          success: result.success,
          message: result.message,
          error: result.error || null,
          duration: result.duration,
          completedAt: result.completedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error)?.message }, 
      { status: 500 }
    );
  }
} 