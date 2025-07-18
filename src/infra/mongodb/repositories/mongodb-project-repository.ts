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
      const project: ProjectDocument = {
        name: projectName,
        createdAt: new Date(),
        lastAccessed: new Date(),
        memoryCount: 0,
        tags: []
      };

      await this.collection!.insertOne(project);
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
