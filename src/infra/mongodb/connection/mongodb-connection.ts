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

    // ✅ FIXED: Create proper Atlas Vector Search Index (not 2dsphere)
    if (mongoConfig.isAtlas && mongoConfig.enableVectorSearch) {
      try {
        console.log('🔍 Creating Atlas Vector Search Index...');

        // ✅ CORRECT: Use createSearchIndex method from official docs
        const result = await memoriesCollection.createSearchIndex({
          name: "vector_index",
          type: "vectorSearch",
          definition: {
            "fields": [
              {
                "type": "vector",
                "path": "contentVector",
                "numDimensions": 1024,
                "similarity": "cosine"
              },
              {
                "type": "filter",
                "path": "projectName"
              }
            ]
          }
        });

        console.log('✅ Atlas Vector Search Index created successfully:', result);
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('ℹ️  Atlas Vector Search Index already exists');
        } else {
          console.warn('⚠️  Atlas Vector Search Index creation failed:', {
            message: error.message,
            code: error.code
          });
          console.warn('This is expected for Community deployments or insufficient permissions');
        }
      }
    }

    // Project collection indexes
    await projectsCollection.createIndex({ name: 1 }, { unique: true });
    await projectsCollection.createIndex({ lastAccessed: -1 });

    console.log('MongoDB indexes created successfully');
  }
}
