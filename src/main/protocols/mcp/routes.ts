// MongoDB-powered controllers following EXACT original memory bank patterns
import { makeMemoryStoreController } from "../../factories/controllers/memory-store/memory-store-controller-factory.js";
import { makeMemorySearchController } from "../../factories/controllers/memory-search/memory-search-controller-factory.js";
import { makeMemoryLoadController } from "../../factories/controllers/memory-load/memory-load-controller-factory.js";
import { makeMemoryDiscoverController } from "../../factories/controllers/memory-discover/memory-discover-controller-factory.js";
import { makeMongoDBListProjectsController } from "../../factories/controllers/mongodb-list-projects/mongodb-list-projects-controller-factory.js";
import { makeMongoDBListProjectFilesController } from "../../factories/controllers/mongodb-list-project-files/mongodb-list-project-files-controller-factory.js";
import { makeMongoDBUpdateController } from "../../factories/controllers/mongodb-update/mongodb-update-controller-factory.js";

// Memory Bank Intelligence controllers (NEW - alioshr patterns) - TEMPORARILY DISABLED
// import { makeMemoryBankValidateController } from "../../factories/controllers/memory-bank-validate/index.js";
// import { makeMemoryBankInitController } from "../../factories/controllers/memory-bank-init/index.js";
// import { makeMemoryBankContextController } from "../../factories/controllers/memory-bank-context/index.js";

import { adaptMcpRequestHandler } from "./adapters/mcp-request-adapter.js";
import { McpRouterAdapter } from "./adapters/mcp-router-adapter.js";

// Backward-compatible adapter for memory_bank_read
const adaptMemoryBankRead = (controller: any) => {
  return adaptMcpRequestHandler({
    handle: async (request: any) => {
      const response = await controller.handle(request);

      // If successful and has memory data, return only content string
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
      description: "List all files within a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
        },
        required: ["projectName"],
      },
    },
    handler: adaptMcpRequestHandler(makeMongoDBListProjectFilesController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_read",
      description: "Read a memory bank file for a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file",
          },
        },
        required: ["projectName", "fileName"],
      },
    },
    handler: adaptMemoryBankRead(makeMemoryLoadController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_write",
      description: "Create a new memory bank file for a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          content: {
            type: "string",
            description: "The content of the file",
          },
        },
        required: ["projectName", "fileName", "content"],
      },
    },
    handler: adaptMcpRequestHandler(makeMemoryStoreController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_update",
      description: "Update an existing memory bank file for a specific project",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
          fileName: {
            type: "string",
            description: "The name of the file",
          },
          content: {
            type: "string",
            description: "The content of the file",
          },
        },
        required: ["projectName", "fileName", "content"],
      },
    },
    handler: adaptMcpRequestHandler(makeMongoDBUpdateController()),
  });

  // ENHANCED MONGODB TOOLS - NEW CAPABILITIES NOT IN ORIGINAL

  router.setTool({
    schema: {
      name: "memory_search",
      description: "Search memories using text or semantic search with MongoDB",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          projectName: {
            type: "string",
            description: "Optional project filter",
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
    handler: adaptMcpRequestHandler(makeMemorySearchController()),
  });



  router.setTool({
    schema: {
      name: "memory_discover",
      description: "Discover related memories based on tags and content similarity",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project",
          },
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
        required: ["projectName", "fileName"],
      },
    },
    handler: adaptMcpRequestHandler(makeMemoryDiscoverController()),
  });

  // MEMORY BANK INTELLIGENCE TOOLS - ORIGINAL ALIOSHR PATTERNS - TEMPORARILY DISABLED
  // TODO: Re-enable after implementing all controller files

  /*
  router.setTool({
    schema: {
      name: "memory_bank_validate",
      description: "Pre-flight validation: Check project existence, core files presence, and identify missing files. Essential before any memory bank operations.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project to validate",
          },
        },
        required: ["projectName"],
      },
    },
    handler: adaptMcpRequestHandler(makeMemoryBankValidateController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_init",
      description: "Initialize memory bank project: Create project and establish core files structure (projectbrief.md, productContext.md, etc.) with templates.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project to initialize",
          },
        },
        required: ["projectName"],
      },
    },
    handler: adaptMcpRequestHandler(makeMemoryBankInitController()),
  });

  router.setTool({
    schema: {
      name: "memory_bank_context",
      description: "Read complete project context: Returns all core files in hierarchical order (foundation → active → tracking) for comprehensive project understanding.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "The name of the project to read context from",
          },
        },
        required: ["projectName"],
      },
    },
    handler: adaptMcpRequestHandler(makeMemoryBankContextController()),
  });
  */

  return router;
};
