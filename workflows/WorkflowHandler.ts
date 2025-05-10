import { Organization } from '../config/organizations';

export interface SubmissionResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
}

export interface WorkflowHandler {
  /**
   * Submits an application to an organization using their specific workflow
   * @param application The application data to submit
   * @param org The organization configuration
   * @returns A promise that resolves to a submission response
   */
  submit: (application: Record<string, unknown>, org: Organization) => Promise<SubmissionResponse>;
}

/**
 * Helper function to map fields based on organization's field mapping
 * @param application The original application data
 * @param fieldMapping The field mapping configuration
 * @returns The application with mapped fields
 */
export function mapFields(
  application: Record<string, unknown>,
  fieldMapping: Record<string, string>
): Record<string, unknown> {
  const result = { ...application };
  
  // Apply field mappings
  for (const [fromField, toField] of Object.entries(fieldMapping)) {
    if (application[fromField] !== undefined && !application[toField]) {
      result[toField] = application[fromField];
    }
  }
  
  return result;
} 