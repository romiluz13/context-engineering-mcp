import { MongoClient, Db } from 'mongodb';
import { mongoConfig } from '../../../main/config/mongodb-config.js';

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private database: Db | null = null;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<Db> {
    if (this.database) {
      return this.database;
    }

    try {
      this.client = new MongoClient(mongoConfig.connectionString);
      await this.client.connect();
      this.database = this.client.db(mongoConfig.databaseName);
      
      console.log(`Connected to MongoDB: ${mongoConfig.isAtlas ? 'Atlas' : 'Community'}`);
      
      // Create indexes for optimal performance
      await this.createIndexes();
      
      return this.database;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.database = null;
      console.log('Disconnected from MongoDB');
    }
  }

  public async getDatabase(): Promise<Db> {
    if (!this.database) {
      await this.connect();
    }
    return this.database!;
  }

  public getDatabaseSync(): Db {
    if (!this.database) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.database;
  }

  private async createIndexes(): Promise<void> {
    if (!this.database) return;

    const memoriesCollection = this.database.collection('memories');
    const projectsCollection = this.database.collection('projects');

    // Memory collection indexes
    await memoriesCollection.createIndex({ projectName: 1, fileName: 1 }, { unique: true });
    await memoriesCollection.createIndex({ projectName: 1 });
    await memoriesCollection.createIndex({ tags: 1 });
    await memoriesCollection.createIndex({ lastModified: -1 });
    
    // Text search index for Community deployments
    await memoriesCollection.createIndex({ 
      content: 'text', 
      fileName: 'text',
      tags: 'text'
    });

    // Vector search index for Atlas deployments (if enabled)
    if (mongoConfig.isAtlas && mongoConfig.enableVectorSearch) {
      try {
        await memoriesCollection.createIndex({
          contentVector: "2dsphere"
        });
        console.log('Vector search index created for Atlas deployment');
      } catch (error) {
        console.warn('Vector search index creation failed (this is normal for Community deployments):', error);
      }
    }

    // Project collection indexes
    await projectsCollection.createIndex({ name: 1 }, { unique: true });
    await projectsCollection.createIndex({ lastAccessed: -1 });

    console.log('MongoDB indexes created successfully');
  }
}
