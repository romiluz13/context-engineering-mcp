// MongoDB-powered controllers following EXACT original memory bank patterns
import { makeMemoryStoreController } from "../../factories/controllers/memory-store/memory-store-controller-factory.js";
import { makeMemorySearchController } from "../../factories/controllers/memory-search/memory-search-controller-factory.js";
import { makeMemoryLoadController } from "../../factories/controllers/memory-load/memory-load-controller-factory.js";
import { makeMemoryDiscoverController } from "../../factories/controllers/memory-discover/memory-discover-controller-factory.js";
import { makeMongoDBListProjectsController } from "../../factories/controllers/mongodb-list-projects/mongodb-list-projects-controller-factory.js";
import { makeMongoDBListProjectFilesController } from "../../factories/controllers/mongodb-list-project-files/mongodb-list-project-files-controller-factory.js";
import { makeMongoDBUpdateController } from "../../factories/controllers/mongodb-update/mongodb-update-controller-factory.js";
import { makeProjectContextDetectionController } from "../../factories/controllers/project-context-detection/project-context-detection-controller-factory.js";
import { setupMemoryBankSystem } from "../../../presentation/mcp/tools/create-vector-search-index.js";
import { createProject, connectToProject } from "../../../presentation/mcp/tools/create-project.js";

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
      description: "🔍 [PRIORITY 1 - START HERE] List all projects in the memory bank. ALWAYS use this first to discover available projects before any other operation. Essential for understanding workspace structure.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: adaptMcpRequestHandler({
      handle: async (request: any) => {
        try {
          const { MongoDBConnection } = await import('../../../infra/mongodb/connection/mongodb-connection.js');
          const db = await MongoDBConnection.getInstance().getDatabase();

          const projects = await db.collection('projects').find({}).sort({ lastAccessed: -1 }).toArray();

          const result = {
            success: true,
            projects: projects.map(p => ({
              projectName: p.projectName,
              projectId: p.projectId,
              description: p.description,
              createdAt: p.createdAt,
              lastAccessed: p.lastAccessed,
              memoryCount: p.metadata?.totalMemories || 0,
              status: p.status
            })),
            message: `Found ${projects.length} projects`,
            instructions: "Use 'connect_to_project' with projectName to connect to a project"
          };

          return {
            statusCode: 200,
            body: result
          };
        } catch (error: any) {
          const errorResult = {
            success: false,
            projects: [],
            message: `Failed to list projects: ${error.message}`,
            instructions: ""
          };

          return {
            statusCode: 500,
            body: errorResult
          };
        }
      }
    })
  });

  router.setTool({
    schema: {
      name: "list_project_files",
      description: "📁 [PRIORITY 2 - EXPLORE] List all files within a specific project. Use after `list_projects` to discover what files exist before reading them. Critical for understanding project content and checking which of the 6 core files have real content vs templates.",
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
      description: "📖 [PRIORITY 3 - READ] Read a memory bank file for a specific project. Primary method to access file content. Use after `list_project_files` to read specific files.",
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
      description: "✏️ [CREATE NEW] Create a new memory bank file for a specific project with intelligent routing to core files. Use when you need to create brand new files. FAILS if file already exists (use memory_bank_update for existing files). IMPORTANT: The system works best when ALL 6 core files have real content, not just templates.",
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
          workingDirectory: {
            type: "string",
            description: "Optional working directory for project detection (defaults to auto-detection)",
          },
          projectName: {
            type: "string",
            description: "Optional explicit project name (overrides auto-detection)",
          },
        },
        required: ["fileName", "content"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMemoryStoreController()),
  });

  // REMOVED: memory_bank_update - functionality merged into memory_bank_write with intelligent routing

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
    handler: adaptUniversalMcpRequestHandler(makeProjectContextDetectionController()),
  });

  router.setTool({
    schema: {
      name: "memory_search",
      description: "🔍 [HIGH PRIORITY - SEARCH] Search for files containing specific text within a project using hybrid search with MongoDB $rankFusion. Essential for finding relevant files when you don't know exact filenames.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query or filename for discovery",
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
            default: true,
          },
          discoverMode: {
            type: "boolean",
            description: "Enable discovery mode to find related memories",
            default: false,
          },
          memoryType: {
            type: "string",
            description: "Filter by memory type (e.g., 'documentation', 'architecture')",
          },
        },
        required: ["query"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMemorySearchController()),
  });

  // 🔄 SEPARATE UPDATE TOOL - Only updates existing files (prevents accidental overwrites)
  router.setTool({
    schema: {
      name: "memory_bank_update",
      description: "🔄 [MODIFY EXISTING] Update an existing memory bank file for a specific project. Automatically creates version history. ONLY works on existing files - fails if file doesn't exist (use memory_bank_write for new files).",
      inputSchema: {
        type: "object",
        properties: {
          fileName: {
            type: "string",
            description: "The name of the file to update",
          },
          content: {
            type: "string",
            description: "The new content of the file",
          },
          projectName: {
            type: "string",
            description: "Optional explicit project name (overrides auto-detection)",
          },
          workingDirectory: {
            type: "string",
            description: "Optional working directory for project detection (defaults to auto-detection)",
          },
        },
        required: ["fileName", "content"],
      },
    },
    handler: adaptUniversalMcpRequestHandler(makeMongoDBUpdateController()),
  });

  // REMOVED: memory_discover - functionality merged into enhanced memory_search

  // ✅ NEW: Create Project Tool (Replaces broken setup)
  router.setTool({
    schema: {
      name: "create_project",
      description: "Create a new memory bank project with complete Cline structure and hybrid search initialization",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "Project name (e.g., 'my-app', 'website-redesign'). If not provided, will generate one."
          },
          description: {
            type: "string",
            description: "Brief project description"
          },
          workingDirectory: {
            type: "string",
            description: "Working directory (defaults to current directory)",
            default: "."
          }
        },
        required: []
      }
    },
    handler: adaptMcpRequestHandler({
      handle: async (request: any) => {
        try {
          const result = await createProject(request);
          return {
            statusCode: 200,
            body: result
          };
        } catch (error: any) {
          const errorResult = {
            success: false,
            projectId: '',
            projectName: '',
            message: `Project creation failed: ${error.message}`,
            coreFiles: [],
            connectionInfo: {
              projectName: '',
              projectId: '',
              workingDirectory: ''
            }
          };

          return {
            statusCode: 500,
            body: errorResult
          };
        }
      }
    })
  });

  // ✅ NEW: Connect to Project Tool
  router.setTool({
    schema: {
      name: "connect_to_project",
      description: "Connect to an existing memory bank project by name or ID",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "Project name or ID to connect to"
          }
        },
        required: ["projectName"]
      }
    },
    handler: adaptMcpRequestHandler({
      handle: async (request: any) => {
        try {
          const result = await connectToProject(request.projectName);
          return {
            statusCode: 200,
            body: result
          };
        } catch (error: any) {
          return {
            statusCode: 500,
            body: {
              success: false,
              message: `Connection failed: ${error.message}`,
              recommendations: ['Check project name and try again']
            }
          };
        }
      }
    })
  });

  // Clean, focused MCP tools - no unused template controllers

  return router;
};
