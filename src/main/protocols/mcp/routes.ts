// MongoDB-powered controllers following EXACT original memory bank patterns
import { makeMemoryStoreController } from "../../factories/controllers/memory-store/memory-store-controller-factory.js";
import { makeMemorySearchController } from "../../factories/controllers/memory-search/memory-search-controller-factory.js";
import { makeMemoryLoadController } from "../../factories/controllers/memory-load/memory-load-controller-factory.js";
import { makeMemoryDiscoverController } from "../../factories/controllers/memory-discover/memory-discover-controller-factory.js";
import { makeMongoDBListProjectsController } from "../../factories/controllers/mongodb-list-projects/mongodb-list-projects-controller-factory.js";
import { makeMongoDBListProjectFilesController } from "../../factories/controllers/mongodb-list-project-files/mongodb-list-project-files-controller-factory.js";
import { makeMongoDBUpdateController } from "../../factories/controllers/mongodb-update/mongodb-update-controller-factory.js";
import { makeProjectContextDetectionController } from "../../factories/controllers/project-context-detection/project-context-detection-controller-factory.js";

// Clean, focused imports - no unused template controllers

import { adaptMcpRequestHandler, adaptUniversalMcpRequestHandler } from "./adapters/mcp-project-aware-adapter.js";
import { McpRouterAdapter } from "./adapters/mcp-router-adapter.js";

// Backward-compatible adapter for memory_bank_read with universal project detection
// Following alioshr/memory-bank-mcp patterns for content return
const adaptMemoryBankRead = (controller: any) => {
  return adaptUniversalMcpRequestHandler({
    handle: async (request: any) => {
      const response = await controller.handle(request);

      // If successful and has memory data, return only content string
      // Following original alioshr/memory-bank-mcp pattern
      if (response.statusCode === 200 && response.body && typeof response.body === 'object' && response.body.content) {
        return {
          ...response,
          body: response.body.content // Return only content string like original alioshr
        };
      }

      return response;
    }
  });
};

export default () => {
  const router = new McpRouterAdapter();

  // ORIGINAL MEMORY BANK TOOLS - EXACT SAME PATTERNS WITH MONGODB BACKEND
  router.setTool({
    schema: {
      name: "list_projects",
      description: "List all projects in the memory bank",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: adaptMcpRequestHandler(makeMongoDBListProjectsController()),
  });

  router.setTool({
    schema: {
      name: "list_project_files",
      description: "List all files within the current project (automatically detected using universal project detection)",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMongoDBListProjectFilesController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_read",
      description: "Read a memory bank file from the current project (automatically detected using universal project detection)",
      inputSchema: {
        type: "object",
        properties: {
          fileName: {
            type: "string",
            description: "The name of the file",
          },
        },
        required: ["fileName"],
      },
    },
    handler: adaptMemoryBankRead(makeMemoryLoadController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_write",
      description: "Create a new memory bank file in the current project (automatically detected using universal project detection)",
      inputSchema: {
        type: "object",
        properties: {
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          content: {
            type: "string",
            description: "The content of the file",
          },
        },
        required: ["fileName", "content"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMemoryStoreController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_update",
      description: "Update an existing memory bank file in the current project (automatically detected using universal project detection)",
      inputSchema: {
        type: "object",
        properties: {
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          content: {
            type: "string",
            description: "The content of the file",
          },
        },
        required: ["fileName", "content"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMongoDBUpdateController()),
  });

  // ENHANCED MONGODB TOOLS - NEW CAPABILITIES NOT IN ORIGINAL

  router.setTool({
    schema: {
      name: "detect_project_context_secure",
      description: "Multi-layer project detection with isolation validation to ensure 100% project isolation",
      inputSchema: {
        type: "object",
        properties: {
          workingDirectory: {
            type: "string",
            description: "Current working directory path",
            default: "."
          },
          validateIsolation: {
            type: "boolean",
            description: "Perform cross-project contamination checks",
            default: true
          },
          forceDetection: {
            type: "boolean",
            description: "Force detection even if confidence is low",
            default: false
          },
          preferredProjectName: {
            type: "string",
            description: "Preferred project name to use if provided"
          }
        },
        required: []
      }
    },
    handler: adaptMcpRequestHandler(makeProjectContextDetectionController()),
  });

  router.setTool({
    schema: {
      name: "memory_search",
      description: "Search memories in the current project using text or semantic search with MongoDB (project automatically detected using universal project detection)",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Optional tag filters",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 10)",
            default: 10,
          },
          useSemanticSearch: {
            type: "boolean",
            description: "Use semantic search if available (Atlas only)",
            default: false,
          },
        },
        required: ["query"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMemorySearchController()),
  });



  router.setTool({
    schema: {
      name: "memory_discover",
      description: "Discover related memories in the current project based on tags and content similarity (project automatically detected using universal project detection)",
      inputSchema: {
        type: "object",
        properties: {
          fileName: {
            type: "string",
            description: "The name of the reference memory file",
          },
          limit: {
            type: "number",
            description: "Maximum number of related memories to return (default: 5)",
            default: 5,
          },
        },
        required: ["fileName"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMemoryDiscoverController()),
  });



  // Clean, focused MCP tools - no unused template controllers

  return router;
};
