import { WorkflowHandler } from './WorkflowHandler';
import { ApiWorkflowHandler } from './handlers/ApiWorkflowHandler';
import { GoogleFormWorkflowHandler } from './handlers/GoogleFormWorkflowHandler';
import { EmailWorkflowHandler } from './handlers/EmailWorkflowHandler';

/**
 * Factory for creating workflow handlers
 */
export class WorkflowFactory {
  // Store instances of handlers for reuse
  private static handlers: Record<string, WorkflowHandler> = {};

  /**
   * Get a workflow handler for the specified workflow type
   * @param workflowType The type of workflow
   * @returns A workflow handler instance
   */
  static getHandler(workflowType: string): WorkflowHandler | null {
    // Return cached instance if available
    if (this.handlers[workflowType]) {
      return this.handlers[workflowType];
    }

    // Create a new instance based on workflow type
    let handler: WorkflowHandler | null = null;

    switch (workflowType) {
      case 'api':
        handler = new ApiWorkflowHandler();
        break;
      case 'googleForm':
        handler = new GoogleFormWorkflowHandler();
        break;
      case 'email':
        handler = new EmailWorkflowHandler();
        break;
      default:
        console.warn(`No handler available for workflow type: ${workflowType}`);
        return null;
    }

    // Cache the instance for future use
    this.handlers[workflowType] = handler;
    return handler;
  }

  /**
   * Register a custom workflow handler
   * @param workflowType The type of workflow
   * @param handler The handler instance
   */
  static registerHandler(workflowType: string, handler: WorkflowHandler): void {
    this.handlers[workflowType] = handler;
  }
} 