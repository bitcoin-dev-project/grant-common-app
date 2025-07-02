import axios from 'axios';
import sgMail from '@sendgrid/mail';
import { Organization } from '../../config/organizations';
import organizations from '../../config/organizations';
import { WorkflowHandler, SubmissionResponse, mapFields } from '../WorkflowHandler';

// Initialize SendGrid with API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Handles submissions to email-based workflows
 */
export class EmailWorkflowHandler implements WorkflowHandler {
  /**
   * Formats text content for email display, preserving user formatting
   * @param text The text to format
   * @param isLongText Whether this is a long text field (textarea)
   * @returns HTML-formatted text with preserved formatting
   */
  private formatTextForEmail(text: string, isLongText: boolean = false): string {
    if (!text || text.trim() === '') {
      return 'Not provided';
    }
    
    // Escape HTML characters to prevent broken HTML
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };
    
    let escapedText = escapeHtml(text);
    
    if (isLongText) {
      // For long text fields (textareas), preserve all formatting exactly as entered
      // Convert line breaks to HTML line breaks
      escapedText = escapedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Split into paragraphs (double line breaks)
      const paragraphs = escapedText.split(/\n\s*\n/);
      
      if (paragraphs.length > 1) {
        // Multiple paragraphs - wrap each in <p> tags and preserve line breaks within
        return paragraphs
          .map(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return '';
            // Replace single line breaks with <br> within paragraphs
            const withBreaks = trimmed.replace(/\n/g, '<br>');
            return `<p style="margin: 0 0 12px 0; line-height: 1.5;">${withBreaks}</p>`;
          })
          .filter(p => p)
          .join('');
      } else {
        // Single paragraph or no paragraph breaks - just replace line breaks with <br>
        return escapedText.replace(/\n/g, '<br>');
      }
    } else {
      // For short text fields, just replace line breaks with spaces or <br> if needed
      return escapedText.replace(/\n/g, '<br>');
    }
  }

  /**
   * Analyzes application content and provides size reduction suggestions
   * @param application The application data to analyze
   * @returns Analysis report with suggestions
   */
  private analyzeApplicationSize(application: Record<string, unknown>): {
    totalSize: number;
    fieldSizes: Array<{field: string, size: number, type: string}>;
    suggestions: string[];
  } {
    const fieldSizes: Array<{field: string, size: number, type: string}> = [];
    const suggestions: string[] = [];
    let totalSize = 0;

    for (const [key, value] of Object.entries(application)) {
      let fieldSize = 0;
      let fieldType = 'text';

      if (value === null || value === undefined) {
        fieldSize = 0;
      } else if (typeof value === 'object' && 'buffer' in value) {
        fieldType = 'file';
        fieldSize = (value as any).buffer?.length || 0;
      } else {
        fieldType = 'text';
        fieldSize = Buffer.byteLength(String(value), 'utf8');
      }

      fieldSizes.push({
        field: key,
        size: fieldSize,
        type: fieldType
      });

      totalSize += fieldSize;
    }

    // Sort by size descending
    fieldSizes.sort((a, b) => b.size - a.size);

    // Generate suggestions based on field sizes
    const largeSizeThreshold = 50 * 1024; // 50KB
    const veryLargeSizeThreshold = 500 * 1024; // 500KB

    for (const field of fieldSizes) {
      if (field.size > veryLargeSizeThreshold) {
        if (field.type === 'file') {
          suggestions.push(`Consider compressing or reducing the size of file: ${field.field} (${(field.size / 1024 / 1024).toFixed(2)}MB)`);
        } else {
          suggestions.push(`Consider shortening the text in: ${field.field} (${(field.size / 1024).toFixed(1)}KB - ${field.size.toLocaleString()} characters)`);
        }
      } else if (field.size > largeSizeThreshold) {
        if (field.type === 'text') {
          suggestions.push(`Field '${field.field}' is quite large (${(field.size / 1024).toFixed(1)}KB). Consider summarizing if possible.`);
        }
      }
    }

    if (suggestions.length === 0 && totalSize > 20 * 1024 * 1024) {
      suggestions.push('Overall application size is large. Consider removing unnecessary files or reducing text length.');
    }

    return {
      totalSize,
      fieldSizes,
      suggestions
    };
  }

  /**
   * Submits an application to an organization using email
   * @param application The application data to submit
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  async submit(application: Record<string, unknown>, org: Organization): Promise<SubmissionResponse> {
    // Log application data size and structure for debugging
    const applicationDataSize = JSON.stringify(application).length;
    const applicationSizeMB = (applicationDataSize / 1024 / 1024).toFixed(2);
    
    console.log(`🚀 EmailWorkflowHandler: Starting submission to ${org.name}`);
    console.log(`📋 Application Data Analysis:`);
    console.log(`   Raw Application Size: ${applicationSizeMB}MB (${applicationDataSize.toLocaleString()} characters)`);
    console.log(`   Number of Fields: ${Object.keys(application).length}`);
    console.log(`   Has File Attachments: ${Object.values(application).some(v => v && typeof v === 'object' && 'buffer' in v)}`);
    console.log(`   Applicant Email: ${application.email || 'Not provided'}`);
    
    // Analyze application size and provide insights
    const sizeAnalysis = this.analyzeApplicationSize(application);
    console.log(`📊 Detailed Size Analysis:`);
    console.log(`   Top 5 largest fields:`);
    sizeAnalysis.fieldSizes.slice(0, 5).forEach((field, index) => {
      const sizeDisplay = field.type === 'file' 
        ? `${(field.size / 1024 / 1024).toFixed(2)}MB` 
        : `${(field.size / 1024).toFixed(1)}KB`;
      console.log(`     ${index + 1}. ${field.field} (${field.type}): ${sizeDisplay}`);
    });
    
    if (sizeAnalysis.suggestions.length > 0) {
      console.log(`💡 Size optimization suggestions:`);
      sizeAnalysis.suggestions.forEach((suggestion, index) => {
        console.log(`     ${index + 1}. ${suggestion}`);
      });
    }
    
    try {
      if (!org.workflowConfig?.emailRecipients || org.workflowConfig.emailRecipients.length === 0) {
        throw new Error('Email recipients are not configured for this organization');
      }

      // Apply field mapping if available
      console.log(`🔄 Applying field mapping for ${org.name}...`);
      const mappedApplication = mapFields(application, org.fieldMapping || {});
      
      // Use SendGrid directly for all email-based workflows
      return this.submitViaSendGrid(mappedApplication, org);
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: unknown } };
      console.error(`❌ Error in EmailWorkflowHandler for ${org.name}:`, err);
      
      return {
        success: false,
        message: `Failed to submit application to ${org.name} (Email)`,
        error: err?.response?.data || err.message
      };
    }
  }

  /**
   * Submits an application using SendGrid directly
   * @param application The mapped application data
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  private async submitViaSendGrid(
    application: Record<string, unknown>, 
    org: Organization
  ): Promise<SubmissionResponse> {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key is not configured (SENDGRID_API_KEY)');
    }

    // Check if SendGrid verified sender is configured
    const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
    if (!verifiedSender) {
      throw new Error('SendGrid verified sender is not configured (SENDGRID_VERIFIED_SENDER)');
    }

    // Add debug logging
    console.log(`🔧 SendGrid Config Debug:`);
    console.log(`   Verified Sender: ${verifiedSender}`);
    console.log(`   Organization: ${org.name}`);
    console.log(`   Email Recipients: ${org.workflowConfig?.emailRecipients?.join(', ')}`);
    console.log(`   Applicant Email: ${application.email}`);
    console.log(`   Is Sending Confirmation: ${application.isSendingConfirmation}`);

    // Helper function to calculate email size
    const calculateEmailSize = (emailObject: any): number => {
      const emailJson = JSON.stringify(emailObject);
      return Buffer.byteLength(emailJson, 'utf8');
    };

    // Helper function to truncate long text fields if needed
    const truncateIfNeeded = (text: string, maxLength: number = 15000): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '\n\n[... content truncated due to email size limits ...]';
    };

    try {
      // Format the application data for the email body
      let htmlBody = '';
      
      // Prepare attachments array for files
      const attachments: {content: string, filename: string, type: string, disposition: string}[] = [];
      let totalAttachmentSize = 0;
      
      // Organize application data by section
      const sections: Record<string, Array<{key: string, label: string, value: string}>> = {
        'Project Details': [],
        'Applicant Information': [],
        'References': [],
        'Other Information': []
      };
      
      // Define strict categorization for fields - ensure no duplicates
      const sectionMappings: Record<string, string> = {
        // Project Details
        'project_name': 'Project Details',
        'project_description': 'Project Details',
        'main_focus': 'Project Details',
        'potential_impact': 'Project Details',
        'focus_area_description': 'Project Details',
        'grant_purpose': 'Project Details',
        'github': 'Project Details',
        'license': 'Project Details',
        'free_open_source': 'Project Details',
        'grant_proposal': 'Project Details',
        
        // Applicant Information
        'your_name': 'Applicant Information',
        'name': 'Applicant Information',
        'email': 'Applicant Information',
        'personal_github': 'Applicant Information',
        'twitter_handle': 'Applicant Information',
        'twitter': 'Applicant Information',
        'linkedin_profile': 'Applicant Information',
        'linkedin': 'Applicant Information',
        'personal_website': 'Applicant Information',
        'website': 'Applicant Information',
        'city': 'Applicant Information',
        'country': 'Applicant Information',
        'phone': 'Applicant Information',
        'technical_background': 'Applicant Information',
        'bitcoin_contributions': 'Applicant Information',
        'why_considered': 'Applicant Information',
        
        // References
        'references': 'References'
        
        // Everything else will go to Other Information
      };
      
      // Identify fields that should be displayed with special formatting for long text
      const longTextFields = [
        'project_description', 
        'technical_background', 
        'bitcoin_contributions', 
        'references',
        'potential_impact',
        'focus_area_description',
        'grant_purpose',
        'why_considered'
      ];
      
      // Process each field into a section
      for (const [key, value] of Object.entries(application)) {
        // Skip internal flags and organizations array, but NOT files
        if (key === 'isSendingConfirmation' || key === 'organizations') {
          continue;
        }
        
        // Only include fields that are mapped for this organization or are common fields
        // Check if this field is mapped in the organization's fieldMapping
        const isMappedField = org.fieldMapping && (
          Object.keys(org.fieldMapping).includes(key) || // Field is a source in mapping
          Object.values(org.fieldMapping).includes(key)  // Field is a target in mapping
        );
        
        // Check if this is a common field that should be included
        const isCommonField = ['name', 'email', 'project_name', 'project_description', 'grant_proposal'].includes(key);
        
        // Skip fields not relevant to this organization
        if (!isMappedField && !isCommonField && !sectionMappings[key]) {
          continue;
        }
        
        // Format the field label
        let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Format the field value
        let formattedValue = '';
        
        if (value === null || value === undefined) {
          formattedValue = 'Not provided';
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'Yes' : 'No';
        } else if (Array.isArray(value)) {
          formattedValue = value.join(', ');
        } else if (typeof value === 'object' && 'buffer' in value) {
          // This is a file, handle it separately
          const file = value as { buffer: Buffer, originalname: string, mimetype: string };
          
          // Check attachment size (SendGrid limit is 30MB total)
          const fileSize = file.buffer.length;
          totalAttachmentSize += fileSize;
          
          console.log(`📎 Processing attachment: ${file.originalname} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
          
          if (totalAttachmentSize > 25 * 1024 * 1024) { // 25MB limit to leave room for email content
            console.warn(`⚠️  Attachment ${file.originalname} would exceed size limit. Skipping attachment.`);
            formattedValue = `File would exceed email size limit: ${file.originalname} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`;
          } else {
            // Add to attachments
            attachments.push({
              content: file.buffer.toString('base64'),
              filename: file.originalname,
              type: file.mimetype,
              disposition: 'attachment'
            });
            
            formattedValue = `File attached: ${file.originalname}`;
          }
        } else {
          const textValue = String(value);
          
          // Log field sizes for long text fields
          if (longTextFields.includes(key) && textValue.length > 1000) {
            console.log(`📝 Long text field: ${key} (${textValue.length} characters)`);
          }
          
          // Truncate very long text fields to prevent email size issues
          const processedValue = longTextFields.includes(key) ? truncateIfNeeded(textValue) : textValue;
          formattedValue = this.formatTextForEmail(processedValue, longTextFields.includes(key));
        }
        
        // Determine which section this field belongs to
        const section = sectionMappings[key] || 'Other Information';
        
        // Add to the appropriate section
        sections[section].push({
          key,
          label,
          value: formattedValue
        });
      }
      
      // Start building HTML email
      htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 20px;
            background-color: #f7fafc;
          }
          .email-container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #f2a900 0%, #e97914 100%);
            color: white;
            padding: 24px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          }
          .header h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            letter-spacing: 0.3px;
          }
          .header .subtitle {
            font-size: 15px;
            margin-top: 6px;
            opacity: 0.95;
            font-weight: 500;
          }
          .content {
            padding: 0;
            background-color: #fafbfc;
          }
          .fields-container {
            display: block;
            width: 100%;
          }
          .section {
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            border-bottom: 2px solid #f8fafc;
          }
          .section:last-child {
            border-bottom: none;
          }
          .section:nth-child(even) {
            background-color: #fafbfc;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 18px 0;
            padding: 0 0 10px 0;
            border-bottom: 2px solid #f2a900;
            display: block;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            position: relative;
          }
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 50px;
            height: 2px;
            background: linear-gradient(135deg, #f2a900 0%, #e97914 100%);
            border-radius: 1px;
          }
          .field {
            margin-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 12px;
          }
          .field:last-child {
            margin-bottom: 0;
            border-bottom: none;
            padding-bottom: 0;
          }
          .field-label {
            font-weight: 600;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            display: block;
          }
          .field-value {
            background-color: #ffffff;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.5;
            min-height: 20px;
            position: relative;
          }
          .field-value.long-text {
            background-color: #fafbfc;
            border: 2px solid #f2a900;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            padding: 16px;
          }
          .field-value.long-text::before {
            content: '';
            position: absolute;
            left: -2px;
            top: -2px;
            bottom: -2px;
            width: 4px;
            background: linear-gradient(135deg, #f2a900 0%, #e97914 100%);
            border-radius: 3px 0 0 3px;
          }
          .field-value.short-text {
            background-color: #ffffff;
            font-weight: 500;
          }
          .field-value p {
            margin: 0 0 12px 0;
            line-height: 1.6;
          }
          .field-value p:last-child {
            margin-bottom: 0;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #718096;
            font-size: 13px;
            margin: 0;
          }
          .timestamp {
            color: #a0aec0;
            font-size: 11px;
            margin-top: 8px;
          }
          @media (max-width: 768px) {
            body {
              padding: 12px;
            }
            .email-container {
              max-width: 100%;
              border-radius: 10px;
            }
            .header {
              padding: 20px 16px;
            }
            .header h1 {
              font-size: 19px;
            }
            .header .subtitle {
              font-size: 14px;
            }
            .section {
              padding: 20px 16px;
            }
            .section-title {
              font-size: 16px;
              margin-bottom: 14px;
            }
            .field-value {
              padding: 10px 12px;
              font-size: 13px;
            }
            .field-value.long-text {
              padding: 14px;
              font-size: 12px;
            }
          }
          @media (max-width: 480px) {
            body {
              padding: 8px;
            }
            .header {
              padding: 18px 12px;
            }
            .header h1 {
              font-size: 18px;
            }
            .section {
              padding: 18px 12px;
            }
            .section-title {
              font-size: 15px;
              margin-bottom: 12px;
            }
            .field {
              margin-bottom: 12px;
            }
            .field-value {
              padding: 10px;
              font-size: 13px;
            }
            .field-value.long-text {
              padding: 12px;
              font-size: 11px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>New Grant Application</h1>
            <div class="subtitle">Submitted to ${org.name}</div>
          </div>
          
          <div class="content">
      `;
      
      // Add each section to the email body
      for (const [sectionName, fields] of Object.entries(sections)) {
        // Skip empty sections
        if (fields.length === 0) continue;
        
        htmlBody += `
            <div class="section">
              <h3 class="section-title">${sectionName}</h3>
              <div class="fields-container">
        `;
        
        // Add each field in the section
        for (const field of fields) {
          const isLongText = longTextFields.includes(field.key);
          const cssClass = isLongText ? 'long-text' : 'short-text';
          
          htmlBody += `
              <div class="field">
                <div class="field-label">${field.label}</div>
                <div class="field-value ${cssClass}">${field.value}</div>
              </div>
          `;
        }
        
        htmlBody += `
              </div>
            </div>
        `;
      }
      
      // Close HTML body
      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      htmlBody += `
          </div>
          <div class="footer">
            <p>This application was submitted via the Bitcoin Grants Common Application Platform.</p>
            <div class="timestamp">Submitted on ${timestamp}</div>
          </div>
        </div>
      </body>
      </html>
      `;

      // Check if this is a confirmation-only request
      const isSendingConfirmation = application.isSendingConfirmation as boolean;
      
      // If this is NOT a confirmation-only request, send to organization
      if (!isSendingConfirmation || org.id !== 'confirmation') {
        // Send application details to organization recipients
        const orgMsg = {
          to: org.workflowConfig?.emailRecipients,
          from: verifiedSender,
          subject: org.workflowConfig?.emailSubject || `New Grant Application for ${org.name}`,
          html: htmlBody,
          attachments: attachments.length > 0 ? attachments : undefined,
        };

        // Calculate and log email size before sending
        const emailSize = calculateEmailSize(orgMsg);
        const emailSizeMB = (emailSize / 1024 / 1024).toFixed(2);
        
        console.log(`📏 Email Size Analysis:`);
        console.log(`   Organization: ${org.name}`);
        console.log(`   HTML Body Length: ${htmlBody.length.toLocaleString()} characters`);
        console.log(`   Attachments: ${attachments.length} files (${(totalAttachmentSize / 1024 / 1024).toFixed(2)}MB)`);
        console.log(`   Total Email Size: ${emailSizeMB}MB`);
        console.log(`   Recipients: ${org.workflowConfig?.emailRecipients?.join(', ')}`);
        
        // SendGrid has a 30MB limit, but we'll warn at 20MB and fail at 25MB for safety
        if (emailSize > 25 * 1024 * 1024) {
          throw new Error(`Email size (${emailSizeMB}MB) exceeds SendGrid limit. Please reduce content size or attachments.`);
        } else if (emailSize > 20 * 1024 * 1024) {
          console.warn(`⚠️  Email size (${emailSizeMB}MB) is approaching SendGrid limits. Consider reducing content.`);
        }

        try {
          console.log(`📤 Sending application email to ${org.name}...`);
          await sgMail.send(orgMsg);
          console.log(`✅ Application details sent successfully to ${org.name} recipients`);
        } catch (emailError) {
          console.error(`❌ Failed to send application email to ${org.name}:`);
          console.error(`   Error:`, emailError);
          
          // Log detailed SendGrid error information
          if (emailError && typeof emailError === 'object' && 'response' in emailError) {
            const sgError = emailError as any;
            console.error(`   SendGrid Error Details:`);
            console.error(`     Status Code: ${sgError.code}`);
            console.error(`     Response Body:`, sgError.response?.body);
            console.error(`     Response Headers:`, sgError.response?.headers);
            
            // Check for specific error types
            if (sgError.response?.body?.errors) {
              sgError.response.body.errors.forEach((error: any, index: number) => {
                console.error(`     Error ${index + 1}: ${error.message} (${error.field})`);
              });
            }
          }
          
          throw emailError; // Re-throw to be handled by outer catch
        }
      } else {
        console.log(`📧 This is a confirmation-only request, skipping organization email for ${org.name}`);
      }
      
      // Send confirmation email to applicant if email is provided and this is a confirmation request
      const applicantEmail = application.email as string;
      
      if (applicantEmail && isSendingConfirmation) {
        console.log(`📧 Preparing confirmation email for: ${applicantEmail}`);
        
        // Get submission summary if available
        const submissionSummary = application.submissionSummary as any;
        const appliedOrgs = application.organizations as string[] || [org.id];
        
        console.log(`   Organizations: ${appliedOrgs.join(', ')}`);
        if (submissionSummary) {
          console.log(`   Summary: ${submissionSummary.successful}/${submissionSummary.total} successful`);
        }
        
        // Create list items for each successful org
        let appliedOrgsList = '';
        let orgButtons = '';
        
        for (const orgId of appliedOrgs) {
          if (organizations[orgId]) {
            const orgInfo = organizations[orgId];
            appliedOrgsList += `<li>${orgInfo.name}</li>`;
            orgButtons += `
              <a href="${orgInfo.website}" style="display: inline-block; margin: 10px; padding: 10px 15px; background-color: #f1760d; color: white; text-decoration: none; border-radius: 5px;">
                ${orgInfo.name} Website
              </a>
            `;
          }
        }
        
        // Add summary information if some submissions failed
        let summaryMessage = '';
        if (submissionSummary && submissionSummary.failed > 0) {
          summaryMessage = `
            <div style="background-color: #fef3cd; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 3px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">
                Note: Your application was successfully submitted to ${submissionSummary.successful} out of ${submissionSummary.total} selected organizations.
                ${submissionSummary.failed > 0 ? `${submissionSummary.failed} submission(s) failed due to technical issues.` : ''}
              </p>
            </div>
          `;
        }
        
        // Create thank you message
        const thankYouMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #2d3748;
              margin: 0;
              padding: 20px;
              background-color: #f7fafc;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f2a900 0%, #e97914 100%);
              color: white;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              font-size: 20px;
              font-weight: 700;
              margin: 0;
              text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            }
            .content {
              padding: 24px;
            }
            .success-icon {
              text-align: center;
              margin-bottom: 16px;
            }
            .org-list {
              background-color: #fef7ed;
              padding: 16px;
              border-radius: 6px;
              margin: 16px 0;
              border-left: 3px solid #f2a900;
            }
            .org-list ul {
              list-style: none;
              margin: 0;
              padding: 0;
            }
            .org-list li {
              padding: 6px 0;
              border-bottom: 1px solid #fed7aa;
              font-weight: 500;
              color: #9a3412;
            }
            .org-list li:last-child {
              border-bottom: none;
            }
            .buttons-container {
              margin: 20px 0;
              text-align: center;
            }
            .org-button {
              display: inline-block;
              margin: 6px;
              padding: 10px 16px;
              background-color: #f2a900;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              transition: background-color 0.3s ease;
            }
            .org-button:hover {
              background-color: #e97914;
            }
            .footer {
              background-color: #f8fafc;
              padding: 16px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #718096;
            }
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              .email-container {
                border-radius: 10px;
              }
              .header {
                padding: 18px;
              }
              .header h1 {
                font-size: 18px;
              }
              .content {
                padding: 18px;
              }
              .org-list {
                padding: 12px;
                margin: 12px 0;
              }
              .buttons-container {
                margin: 16px 0;
              }
              .org-button {
                margin: 4px;
                padding: 8px 12px;
                font-size: 12px;
              }
              .footer {
                padding: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Application Submitted Successfully! ✓</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">
                <span style="font-size: 40px; color: #f2a900;">✓</span>
              </div>
              
              <p style="font-size: 15px; margin-bottom: 16px;">Thank you for submitting your Bitcoin grant application! Your proposal has been successfully sent to the following organization(s):</p>
              
              ${summaryMessage}
              
              <div class="org-list">
                <ul>
                ${appliedOrgsList}
                </ul>
              </div>
              
              <p style="margin: 16px 0;">Your proposal will be reviewed by each organization according to their own criteria and timeline. The review process typically takes 2-8 weeks depending on application volume and complexity.</p>
              
              <p style="margin: 16px 0;">You'll be contacted directly by the organizations if they need additional information or wish to move forward with funding discussions.</p>
              
              <div class="buttons-container">
                ${orgButtons.replace(/style="[^"]*"/g, 'class="org-button"')}
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated confirmation from the Bitcoin Grants Common Application Platform.</p>
              <p style="margin-top: 8px; color: #a0aec0; font-size: 11px;">If you have questions, please contact the organizations directly.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        const applicantMsg = {
          to: applicantEmail,
          from: verifiedSender,
          subject: `Your Bitcoin Grant Application Has Been Successfully Submitted`,
          html: thankYouMessage,
        };

        try {
          // Calculate and log confirmation email size
          const confirmEmailSize = calculateEmailSize(applicantMsg);
          const confirmEmailSizeMB = (confirmEmailSize / 1024 / 1024).toFixed(2);
          
          console.log(`📤 Sending confirmation email:`);
          console.log(`   FROM: ${verifiedSender}`);
          console.log(`   TO: ${applicantEmail}`);
          console.log(`   Subject: Your Bitcoin Grant Application Has Been Successfully Submitted`);
          console.log(`   Email Size: ${confirmEmailSizeMB}MB`);
          
          // Check size before sending
          if (confirmEmailSize > 25 * 1024 * 1024) {
            throw new Error(`Confirmation email size (${confirmEmailSizeMB}MB) exceeds SendGrid limit.`);
          }
          
          await sgMail.send(applicantMsg);
          console.log(`✅ Confirmation email sent successfully to: ${applicantEmail}`);
        } catch (emailError) {
          console.error(`❌ Failed to send confirmation email to ${applicantEmail}:`);
          console.error(`   Error:`, emailError);
          
          // Log detailed SendGrid error information
          if (emailError && typeof emailError === 'object' && 'response' in emailError) {
            const sgError = emailError as any;
            console.error(`   SendGrid Error Details:`);
            console.error(`     Status Code: ${sgError.code}`);
            console.error(`     Response Body:`, sgError.response?.body);
            console.error(`     Response Headers:`, sgError.response?.headers);
            
            // Check for specific error types
            if (sgError.response?.body?.errors) {
              sgError.response.body.errors.forEach((error: any, index: number) => {
                console.error(`     Error ${index + 1}: ${error.message} (${error.field})`);
              });
            }
          }
          
          // Don't throw here - we still want the org submission to succeed
          // even if confirmation email fails
          console.log(`⚠️  Continuing with submission despite confirmation email failure`);
        }
      }
      
      return {
        success: true,
        message: `Application submitted successfully to ${org.name} (Email via SendGrid)`,
        data: {}
      };
    } catch (error) {
      console.error(`❌ Error sending ${org.name} emails via SendGrid:`, error);
      
             // Provide more specific error messages based on error type
       if (error instanceof Error) {
         if (error.message.includes('exceeds SendGrid limit')) {
           console.error(`📏 Email size issue detected for ${org.name}`);
           
           // Re-analyze application to provide specific suggestions
           const sizeAnalysis = this.analyzeApplicationSize(application);
           const topLargeFields = sizeAnalysis.fieldSizes.slice(0, 3)
             .filter(f => f.size > 10 * 1024) // Only show fields > 10KB
             .map(f => `${f.field} (${f.type === 'file' ? (f.size / 1024 / 1024).toFixed(1) + 'MB' : (f.size / 1024).toFixed(1) + 'KB'})`)
             .join(', ');
           
           const errorMsg = `Email size too large for ${org.name}. ` +
             (topLargeFields ? `Largest fields: ${topLargeFields}. ` : '') +
             `Please reduce the length of your application text or file attachments.`;
           
           throw new Error(errorMsg);
         } else if (error.message.includes('timeout')) {
           console.error(`⏱️  Timeout issue detected for ${org.name}`);
           throw new Error(`Email sending timed out for ${org.name}. Please try again.`);
         } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
           console.error(`🔒 Authentication issue detected for ${org.name}`);
           throw new Error(`Email authentication failed for ${org.name}. This is a configuration issue.`);
         }
       }
      
      throw error;
    }
  }
} 