/**
 * Smart Content Save Tool
 * Fixes the template vs content confusion and file existence logic
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartOperationRouter } from '../../../shared/services/smart-operation-router.js';
import { MCPErrorHandler } from '../../../shared/errors/mcp-error.js';

export const smartContentSaveTool: Tool = {
  name: 'smart_content_save',
  description: `💾 SMART CONTENT SAVE - Intelligently handles all content saving scenarios.

This tool eliminates the confusion between memory_bank_write and memory_bank_update by:
- Auto-detecting template vs real content
- Intelligent merging of existing content
- Smart routing to appropriate core files
- Clear feedback on what happened

FIXES: The "file already exists" errors and template confusion.

Parameters:
- fileName: Target file name
- content: Content to save
- mergeStrategy (optional): 'replace', 'merge', or 'auto' (default)

Returns structured response with:
- Clear indication of what was done (created/updated/merged)
- Content routing information
- File status and next actions`,

  inputSchema: {
    type: 'object',
    properties: {
      fileName: {
        type: 'string',
        description: 'Target file name (e.g., "projectbrief.md", "techContext.md")'
      },
      content: {
        type: 'string',
        description: 'Content to save'
      },
      mergeStrategy: {
        type: 'string',
        enum: ['replace', 'merge', 'auto'],
        description: 'How to handle existing content (default: auto)'
      }
    },
    required: ['fileName', 'content']
  }
};

export async function handleSmartContentSave(params: any): Promise<any> {
  const router = new SmartOperationRouter();
  
  try {
    const result = await router.executeSmartOperation({
      intent: 'save_content',
      parameters: {
        ...params,
        mergeStrategy: params.mergeStrategy || 'auto'
      }
    });

    if (result.success) {
      const action = result.result.created ? 'created' : 
                    result.result.updated ? 'updated' : 
                    result.result.merged ? 'merged' : 'processed';

      return {
        success: true,
        message: `✅ Successfully ${action} ${params.fileName}`,
        result: {
          fileName: params.fileName,
          action,
          contentLength: params.content.length,
          ...result.result
        },
        sessionState: {
          activeProject: result.sessionState.activeProject,
          statusMessage: result.statusMessage
        },
        nextActions: result.nextActions.slice(0, 3),
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: `❌ Failed to save ${params.fileName}: ${result.error.message}`,
        error: result.error,
        recoveryOptions: result.recoveryOptions,
        nextActions: result.nextActions.slice(0, 3),
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    const mcpError = MCPErrorHandler.formatError(error, { tool: 'smart_content_save', params });
    
    return {
      success: false,
      message: `❌ Error saving content: ${mcpError.message}`,
      error: mcpError,
      recoveryOptions: mcpError.recoveryOptions,
      suggestedActions: mcpError.suggestedActions,
      timestamp: new Date().toISOString()
    };
  }
}
