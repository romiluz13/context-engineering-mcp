import {
  Request as MCPRequest,
  ServerResult as MCPResponse,
} from "@modelcontextprotocol/sdk/types.js";
import { Controller } from "../../../../presentation/protocols/controller.js";
import { serializeError } from "../helpers/serialize-error.js";
import { normalizeProjectNameSafe, getCurrentProjectName, detectProjectFromPath, detectProjectForMCP } from "../../../../shared/utils/project-name-normalizer.js";
import { getProjectName } from "../../../../shared/services/project-context-manager.js";
import { MCPRequestHandler } from "./mcp-router-adapter.js";

/**
 * Intelligently serializes response body for MCP protocol
 * - Strings: returned as-is
 * - String arrays: joined with newlines for readability
 * - Complex objects/arrays: JSON stringified
 * - null/undefined: empty string
 */
const serializeResponseBody = (body: any): string => {
  if (body === null || body === undefined) {
    return "";
  }

  // Handle strings directly (most common case for memory bank)
  if (typeof body === "string") {
    return body;
  }

  // Handle string arrays (like original list_projects, list_project_files)
  if (Array.isArray(body) && body.every(item => typeof item === "string")) {
    return body.join("\n");
  }

  // Handle complex objects and arrays (MongoDB enhanced features)
  return JSON.stringify(body, null, 2);
};

/**
 * Universal MCP request adapter with multi-signal project detection
 * Implements universal project detection following MCP patterns and MongoDB best practices
 * Based on research from alioshr/memory-bank-mcp and MongoDB official MCP server
 */
export const adaptUniversalMcpRequestHandler = async <
  T extends any,
  R extends Error | any
>(
  controller: Controller<T, R>
): Promise<MCPRequestHandler> => {
  return async (request: MCPRequest): Promise<MCPResponse> => {
    const { params } = request;
    let body = params?.arguments as T;

    try {
      // CRITICAL FIX: Use workingDirectory parameter if provided
      let projectName: string;

      // Check if project name is already provided in the request
      if (body && typeof body === 'object' && 'projectName' in body && body.projectName) {
        projectName = body.projectName as string;
      } else {
        // Use workingDirectory parameter if provided for project detection
        const workingDirectory = body && typeof body === 'object' && 'workingDirectory' in body
          ? body.workingDirectory as string
          : undefined;

        console.log(`[MCP-ADAPTER] Request body:`, JSON.stringify(body));
        console.log(`[MCP-ADAPTER] Extracted workingDirectory: "${workingDirectory}"`);

        // Use master project context manager for 100% consistency
        console.log(`[MCP-ADAPTER] Using master project context manager`);
        projectName = await getProjectName(workingDirectory);
      }

      // Inject or override project name with detected value
      body = {
        ...(body || {}),
        projectName
      } as T;

    } catch (error) {
      console.error(`[UNIVERSAL-ADAPTER] Error detecting project:`, error);
      // Return error following MCP patterns
      return {
        tools: [],
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(serializeError(error)),
          },
        ],
      };
    }

    const response = await controller.handle({
      body,
    });

    const isError = response.statusCode < 200 || response.statusCode >= 300;

    return {
      tools: [],
      isError,
      content: [
        {
          type: "text",
          text: isError
            ? JSON.stringify(serializeError(response.body))
            : serializeResponseBody(response.body),
        },
      ],
    };
  };
};

/**
 * Path-based adapter (LEGACY - use adaptUniversalMcpRequestHandler)
 * Kept for backward compatibility during transition
 */
export const adaptPathBasedMcpRequestHandler = adaptUniversalMcpRequestHandler;

/**
 * Project-aware adapter (LEGACY - use adaptUniversalMcpRequestHandler)
 * Kept for backward compatibility during transition
 */
export const adaptProjectAwareMcpRequestHandler = adaptUniversalMcpRequestHandler;

/**
 * Standard MCP request adapter (without project detection)
 * Used for operations that don't involve project names (like list_projects)
 */
export const adaptMcpRequestHandler = async <
  T extends any,
  R extends Error | any
>(
  controller: Controller<T, R>
): Promise<MCPRequestHandler> => {
  return async (request: MCPRequest): Promise<MCPResponse> => {
    const { params } = request;
    const body = params?.arguments as T;
    const response = await controller.handle({
      body,
    });

    const isError = response.statusCode < 200 || response.statusCode >= 300;

    return {
      tools: [],
      isError,
      content: [
        {
          type: "text",
          text: isError
            ? JSON.stringify(serializeError(response.body))
            : serializeResponseBody(response.body),
        },
      ],
    };
  };
};
