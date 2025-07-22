/**
 * Create Project Tool
 * Replaces the broken setup tool with explicit project creation
 * Creates complete Cline memory bank structure immediately
 */

import { v4 as uuidv4 } from 'uuid';
import { ClineMemoryStructure, CLINE_CORE_FILES } from '../../../shared/services/cline-memory-structure.js';
import { setProjectContext } from '../../../shared/services/project-context-manager.js';
import { normalizeProjectName } from '../../../shared/utils/project-name-normalizer.js';

interface CreateProjectRequest {
  projectName?: string;
  description?: string;
  workingDirectory?: string;
}

interface CreateProjectResponse {
  success: boolean;
  projectId: string;
  projectName: string;
  message: string;
  coreFiles: string[];
  connectionInfo: {
    projectName: string;
    projectId: string;
    workingDirectory: string;
  };
  error?: string;
  suggestedActions?: string[];
}

export async function createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
  try {
    const workingDirectory = request.workingDirectory || process.cwd();
    
    // Generate project name if not provided
    let projectName: string;
    if (request.projectName) {
      projectName = normalizeProjectName(request.projectName);
    } else {
      // Generate simple, memorable project name
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 random chars
      projectName = `project-${timestamp}-${randomSuffix}`;
    }

    // Generate unique project ID
    const projectId = uuidv4();

    console.log(`[CREATE-PROJECT] Creating project: ${projectName} (ID: ${projectId})`);

    // Set project context using master project context manager
    await setProjectContext(projectName, workingDirectory);

    // Get MongoDB connection
    const { MongoDBConnection } = await import('../../../infra/mongodb/connection/mongodb-connection.js');
    const db = await MongoDBConnection.getInstance().getDatabase();

    // Create project record
    const projectRecord = {
      projectId,
      projectName,
      description: request.description || `Memory bank project: ${projectName}`,
      workingDirectory,
      createdAt: new Date(),
      lastAccessed: new Date(),
      status: 'active',
      coreFilesCreated: true,
      metadata: {
        version: '1.8.0',
        structure: 'cline-memory-bank',
        totalMemories: 6, // Will have 6 core files
        lastActivity: new Date()
      }
    };

    await db.collection('projects').insertOne(projectRecord);

    // 🎯 CREATE ALL 6 CORE FILES IMMEDIATELY (Like Cline)
    const coreFiles = Object.values(CLINE_CORE_FILES);
    const memoriesCollection = db.collection('memories');

    for (const coreFile of coreFiles) {
      const template = ClineMemoryStructure.getCoreFileTemplate(coreFile, projectName);
      
      // Add project-specific content to projectbrief.md
      let content = template;
      if (coreFile === CLINE_CORE_FILES.PROJECT_BRIEF && request.description) {
        content = template.replace(
          '- [Define core requirements here]',
          `- ${request.description}`
        );
      }

      const memory = {
        projectName,
        fileName: coreFile,
        content,
        tags: ['core', 'cline-structure', 'initialized'],
        lastModified: new Date(),
        wordCount: content.split(/\s+/).length,
        memoryType: 'documentation',
        summary: `Core memory file: ${coreFile}`,
        metadata: {
          aiContextType: 'structural',
          codeRelevance: 0.8,
          technicalDepth: 0.7,
          isCore: true,
          coreFileType: coreFile
        }
      };

      await memoriesCollection.insertOne(memory);
      console.log(`[CREATE-PROJECT] Created core file: ${coreFile}`);
    }

    // 🔍 HYBRID SEARCH: Initialize vector embeddings for all core files
    try {
      const { VoyageEmbeddingService } = await import('../../../infra/ai/voyage-embedding-service.js');
      const embeddingService = new VoyageEmbeddingService();

      for (const coreFile of coreFiles) {
        const memory = await memoriesCollection.findOne({ projectName, fileName: coreFile });
        if (memory && !memory.contentVector) {
          try {
            const vector = await embeddingService.generateEmbedding(memory.content);
            await memoriesCollection.updateOne(
              { _id: memory._id },
              { $set: { contentVector: vector } }
            );
            console.log(`[CREATE-PROJECT] Generated vector for: ${coreFile}`);
          } catch (vectorError) {
            console.warn(`[CREATE-PROJECT] Vector generation failed for ${coreFile}: ${vectorError}`);
          }
        }
      }
    } catch (embeddingError) {
      console.warn(`[CREATE-PROJECT] Vector embedding service unavailable: ${embeddingError}`);
    }

    return {
      success: true,
      projectId,
      projectName,
      message: `Project '${projectName}' created successfully with complete Cline memory bank structure`,
      coreFiles,
      connectionInfo: {
        projectName,
        projectId,
        workingDirectory
      }
    };

  } catch (error) {
    console.error('[CREATE-PROJECT] Error:', error);
    throw new Error(`Failed to create project: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Connect to existing project
 */
export async function connectToProject(projectIdentifier: string): Promise<any> {
  try {
    console.log(`[CONNECT-PROJECT] Connecting to: ${projectIdentifier}`);

    // Get MongoDB connection
    const { MongoDBConnection } = await import('../../../infra/mongodb/connection/mongodb-connection.js');
    const db = await MongoDBConnection.getInstance().getDatabase();

    // Search for project by name or ID
    const project = await db.collection('projects').findOne({
      $or: [
        { projectName: projectIdentifier },
        { projectId: projectIdentifier }
      ]
    });

    if (!project) {
      throw new Error(`Project '${projectIdentifier}' not found`);
    }

    // Set project context
    await setProjectContext(project.projectName, project.workingDirectory);

    // Update last accessed
    await db.collection('projects').updateOne(
      { _id: project._id },
      { $set: { lastAccessed: new Date() } }
    );

    // Get memory count
    const memoryCount = await db.collection('memories').countDocuments({ 
      projectName: project.projectName 
    });

    return {
      success: true,
      projectId: project.projectId,
      projectName: project.projectName,
      message: `Connected to project '${project.projectName}'`,
      memoryCount,
      lastAccessed: project.lastAccessed,
      connectionInfo: {
        projectName: project.projectName,
        projectId: project.projectId,
        workingDirectory: project.workingDirectory
      }
    };

  } catch (error) {
    console.error('[CONNECT-PROJECT] Error:', error);
    throw new Error(`Failed to connect to project: ${error instanceof Error ? error.message : error}`);
  }
}
