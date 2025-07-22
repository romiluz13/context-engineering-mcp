/**
 * Structured MCP Error System
 * Fixes the critical "[object Object]" error problem
 */

export interface RecoveryOption {
  action: string;
  description: string;
  parameters?: any;
  automated?: boolean;
}

export interface MCPError {
  code: string;
  message: string;
  details: string;
  context: any;
  recoveryOptions: RecoveryOption[];
  suggestedActions: string[];
  timestamp: Date;
}

export class MCPErrorHandler {
  
  /**
   * Convert any error to structured MCP format
   */
  static formatError(error: any, context: any = {}): MCPError {
    // Handle different error types
    if (error instanceof Error) {
      return {
        code: error.name || 'UnknownError',
        message: error.message || 'An unexpected error occurred',
        details: error.stack || error.toString(),
        context,
        recoveryOptions: this.getRecoveryOptions(error, context),
        suggestedActions: this.getSuggestedActions(error, context),
        timestamp: new Date()
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        code: 'StringError',
        message: error,
        details: error,
        context,
        recoveryOptions: this.getRecoveryOptions(error, context),
        suggestedActions: ['Try the operation again', 'Check your parameters'],
        timestamp: new Date()
      };
    }

    // Handle object errors (the [object Object] problem)
    if (typeof error === 'object' && error !== null) {
      return {
        code: error.code || error.name || 'ObjectError',
        message: error.message || JSON.stringify(error),
        details: JSON.stringify(error, null, 2),
        context,
        recoveryOptions: this.getRecoveryOptions(error, context),
        suggestedActions: this.getSuggestedActions(error, context),
        timestamp: new Date()
      };
    }

    // Fallback for any other type
    return {
      code: 'UnknownError',
      message: 'An unknown error occurred',
      details: String(error),
      context,
      recoveryOptions: [
        { action: 'retry', description: 'Try the operation again' },
        { action: 'check_connection', description: 'Check your MongoDB connection' }
      ],
      suggestedActions: ['Try again', 'Check your configuration', 'Contact support'],
      timestamp: new Date()
    };
  }

  /**
   * Get recovery options based on error type
   */
  private static getRecoveryOptions(error: any, context: any): RecoveryOption[] {
    const errorMessage = error?.message || String(error);
    const options: RecoveryOption[] = [];

    // Project-related errors
    if (errorMessage.includes('project') || errorMessage.includes('Project')) {
      options.push(
        { action: 'list_projects', description: 'See available projects' },
        { action: 'create_project', description: 'Create a new project' },
        { action: 'detect_project_context', description: 'Auto-detect project context' }
      );
    }

    // File-related errors
    if (errorMessage.includes('file') || errorMessage.includes('File')) {
      options.push(
        { action: 'list_project_files', description: 'See existing files' },
        { action: 'memory_search', description: 'Search for content' }
      );
    }

    // Connection errors
    if (errorMessage.includes('connection') || errorMessage.includes('MongoDB')) {
      options.push(
        { action: 'check_connection', description: 'Verify MongoDB connection' },
        { action: 'restart_server', description: 'Restart the MCP server' }
      );
    }

    // Default recovery options
    if (options.length === 0) {
      options.push(
        { action: 'retry', description: 'Try the operation again' },
        { action: 'list_projects', description: 'Start with project overview' }
      );
    }

    return options;
  }

  /**
   * Get suggested actions based on error type
   */
  private static getSuggestedActions(error: any, context: any): string[] {
    const errorMessage = error?.message || String(error);
    const actions: string[] = [];

    if (errorMessage.includes('already exists')) {
      actions.push(
        'Use memory_bank_update instead of memory_bank_write',
        'Check if you want to merge content with existing file',
        'Use memory_search to find existing content'
      );
    } else if (errorMessage.includes('not found')) {
      actions.push(
        'Create the project or file first',
        'Check the project name spelling',
        'Use list_projects to see available projects'
      );
    } else if (errorMessage.includes('connection')) {
      actions.push(
        'Check your MongoDB connection string',
        'Verify MongoDB is running',
        'Check your network connection'
      );
    } else {
      actions.push(
        'Try the operation again',
        'Check your parameters',
        'Use list_projects to see current state'
      );
    }

    return actions;
  }

  /**
   * Create a user-friendly error response
   */
  static createErrorResponse(error: any, context: any = {}): any {
    const mcpError = this.formatError(error, context);
    
    return {
      success: false,
      error: mcpError,
      message: `❌ ${mcpError.message}`,
      recoveryOptions: mcpError.recoveryOptions,
      suggestedActions: mcpError.suggestedActions,
      nextSteps: this.getNextSteps(mcpError),
      timestamp: mcpError.timestamp
    };
  }

  /**
   * Get next steps for user
   */
  private static getNextSteps(mcpError: MCPError): string[] {
    const steps: string[] = [];
    
    if (mcpError.recoveryOptions.length > 0) {
      steps.push(`Try: ${mcpError.recoveryOptions[0].description}`);
    }
    
    if (mcpError.suggestedActions.length > 0) {
      steps.push(...mcpError.suggestedActions.slice(0, 2));
    }
    
    return steps;
  }
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_ALREADY_EXISTS: 'PROJECT_ALREADY_EXISTS',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ALREADY_EXISTS: 'FILE_ALREADY_EXISTS',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;
