/**
 * Smart Project Setup Tool
 * Fixes the project creation/connection confusion
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartOperationRouter } from '../../../shared/services/smart-operation-router.js';
import { MCPErrorHandler } from '../../../shared/errors/mcp-error.js';

export const smartProjectSetupTool: Tool = {
  name: 'smart_project_setup',
  description: `🚀 SMART PROJECT SETUP - Intelligently handles all project creation/connection scenarios.

This tool eliminates the confusion between create_project and connect_to_project by:
- Auto-detecting existing projects
- Offering clear options when conflicts exist  
- Providing guided setup flow
- Maintaining session state

FIXES: The "[object Object]" errors and project state confusion.

Parameters:
- projectName (optional): Desired project name
- description (optional): Project description
- workingDirectory (optional): Working directory for detection

Returns structured response with:
- Clear success/error messages
- Next suggested actions
- Session state information
- Recovery options if needed`,

  inputSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        description: 'Desired project name (optional - will auto-generate if not provided)'
      },
      description: {
        type: 'string', 
        description: 'Project description (optional)'
      },
      workingDirectory: {
        type: 'string',
        description: 'Working directory for project detection (optional)'
      }
    }
  }
};

export async function handleSmartProjectSetup(params: any): Promise<any> {
  const router = new SmartOperationRouter();
  
  try {
    const result = await router.executeSmartOperation({
      intent: 'setup_project',
      parameters: params,
      workingDirectory: params.workingDirectory
    });

    if (result.success) {
      return {
        success: true,
        message: `✅ ${result.statusMessage}`,
        result: result.result,
        sessionState: {
          activeProject: result.sessionState.activeProject,
          projectStatus: result.sessionState.projectStatus,
          statusMessage: result.statusMessage
        },
        nextActions: result.nextActions.slice(0, 3),
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: `❌ ${result.error.message}`,
        error: result.error,
        recoveryOptions: result.recoveryOptions,
        nextActions: result.nextActions.slice(0, 3),
        sessionState: {
          recoveryMode: result.sessionState.recoveryMode,
          statusMessage: result.statusMessage
        },
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    const mcpError = MCPErrorHandler.formatError(error, { tool: 'smart_project_setup', params });
    
    return {
      success: false,
      message: `❌ ${mcpError.message}`,
      error: mcpError,
      recoveryOptions: mcpError.recoveryOptions,
      suggestedActions: mcpError.suggestedActions,
      timestamp: new Date().toISOString()
    };
  }
}
