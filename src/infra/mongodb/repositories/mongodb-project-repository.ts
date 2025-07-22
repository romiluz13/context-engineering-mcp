import { Collection, Db } from 'mongodb';
import { Project, ProjectName } from '../../../domain/entities/index.js';
import { ProjectRepository } from '../../../data/protocols/project-repository.js';
import { ProjectDocument } from '../models/project-document.js';
import { MongoDBConnection } from '../connection/mongodb-connection.js';
import { getCollectionNames } from '../../../main/config/mongodb-config.js';

export class MongoDBProjectRepository implements ProjectRepository {
  private db?: Db;
  private collection?: Collection<ProjectDocument>;

  constructor() {
    // Initialize lazily to avoid connection issues
  }

  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      this.db = await MongoDBConnection.getInstance().getDatabase();
      this.collection = this.db.collection<ProjectDocument>(getCollectionNames().projects);
    }
  }

  async ensureProject(projectName: string): Promise<void> {
    await this.ensureConnection();
    const existing = await this.collection!.findOne({ name: projectName });

    if (!existing) {
      // 🚨 CRITICAL FIX: Create project WITH complete 6-file Cline structure
      console.log(`[ENSURE-PROJECT] Creating new project with complete Cline structure: ${projectName}`);

      const project: ProjectDocument = {
        name: projectName,
        createdAt: new Date(),
        lastAccessed: new Date(),
        memoryCount: 6, // Will have 6 core files
        tags: ['cline-structure']
      };

      await this.collection!.insertOne(project);

      // 🎯 CREATE ALL 6 CORE FILES IMMEDIATELY (Same as create_project)
      const { ClineMemoryStructure, CLINE_CORE_FILES } = await import('../../../shared/services/cline-memory-structure.js');
      const { MongoDBConnection } = await import('../connection/mongodb-connection.js');

      const db = await MongoDBConnection.getInstance().getDatabase();
      const memoriesCollection = db.collection('memories');
      const coreFiles = Object.values(CLINE_CORE_FILES);

      // 🔍 HYBRID SEARCH: Initialize for project creation analysis
      let embeddingService: any = null;
      try {
        const { VoyageEmbeddingService } = await import('../../ai/voyage-embedding-service.js');
        embeddingService = new VoyageEmbeddingService();
        console.log(`[ENSURE-PROJECT] Hybrid search enabled for project: ${projectName}`);
      } catch (error) {
        console.warn(`[ENSURE-PROJECT] Hybrid search unavailable: ${error}`);
      }

      for (const coreFile of coreFiles) {
        const template = ClineMemoryStructure.getCoreFileTemplate(coreFile, projectName);

        const memory = {
          projectName,
          fileName: coreFile,
          content: template,
          tags: ['core', 'cline-structure', 'auto-created'],
          lastModified: new Date(),
          wordCount: template.split(/\s+/).length,
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

        const insertResult = await memoriesCollection.insertOne(memory);
        console.log(`[ENSURE-PROJECT] Created core file: ${coreFile}`);

        // 🔍 HYBRID SEARCH: Generate vector embeddings immediately
        if (embeddingService && insertResult.insertedId) {
          try {
            const vector = await embeddingService.generateEmbedding(template);
            await memoriesCollection.updateOne(
              { _id: insertResult.insertedId },
              { $set: { contentVector: vector } }
            );
            console.log(`[ENSURE-PROJECT] Generated vector for: ${coreFile}`);
          } catch (vectorError) {
            console.warn(`[ENSURE-PROJECT] Vector generation failed for ${coreFile}: ${vectorError}`);
          }
        }
      }

      console.log(`[ENSURE-PROJECT] ✅ Project '${projectName}' created with complete 6-file structure`);
    } else {
      // Update last accessed time
      await this.collection!.updateOne(
        { name: projectName },
        { $set: { lastAccessed: new Date() } }
      );
    }
  }

  async listProjects(): Promise<ProjectName[]> {
    await this.ensureConnection();
    const docs = await this.collection!
      .find({})
      .sort({ lastAccessed: -1 })
      .toArray();

    return docs.map(doc => doc.name);
  }

  async projectExists(name: string): Promise<boolean> {
    await this.ensureConnection();
    const doc = await this.collection!.findOne({ name });
    return doc !== null;
  }

  async getProject(projectName: string): Promise<Project | null> {
    await this.ensureConnection();
    const doc = await this.collection!.findOne({ name: projectName });
    return doc ? this.documentToProject(doc) : null;
  }

  async updateProject(project: Project): Promise<Project> {
    await this.ensureConnection();
    const doc: ProjectDocument = {
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      lastAccessed: new Date(),
      memoryCount: project.memoryCount,
      tags: project.tags
    };

    await this.collection!.replaceOne(
      { name: project.name },
      doc,
      { upsert: true }
    );

    return this.documentToProject(doc);
  }

  async deleteProject(projectName: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await this.collection!.deleteOne({ name: projectName });
    return result.deletedCount > 0;
  }

  async incrementMemoryCount(projectName: string): Promise<void> {
    await this.ensureConnection();
    await this.collection!.updateOne(
      { name: projectName },
      {
        $inc: { memoryCount: 1 },
        $set: { lastAccessed: new Date() }
      }
    );
  }

  async decrementMemoryCount(projectName: string): Promise<void> {
    await this.ensureConnection();
    await this.collection!.updateOne(
      { name: projectName },
      {
        $inc: { memoryCount: -1 },
        $set: { lastAccessed: new Date() }
      }
    );
  }

  private documentToProject(doc: ProjectDocument): Project {
    return {
      name: doc.name,
      description: doc.description,
      createdAt: doc.createdAt,
      lastAccessed: doc.lastAccessed,
      memoryCount: doc.memoryCount,
      tags: doc.tags
    };
  }
}
