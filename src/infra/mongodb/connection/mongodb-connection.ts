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

    try {
      console.log('[MongoDB] Creating indexes...');

      // 🔧 SAFE INDEX CREATION: Handle existing indexes gracefully

      // Memory collection indexes
      await this.safeCreateIndex(memoriesCollection, { projectName: 1, fileName: 1 }, { unique: true, name: 'project_file_unique' });
      await this.safeCreateIndex(memoriesCollection, { projectName: 1 }, { name: 'project_index' });
      await this.safeCreateIndex(memoriesCollection, { tags: 1 }, { name: 'tags_index' });
      await this.safeCreateIndex(memoriesCollection, { lastModified: -1 }, { name: 'last_modified_index' });

      // Text search index for Community deployments
      await this.safeCreateIndex(memoriesCollection, {
        content: 'text',
        fileName: 'text',
        tags: 'text'
      }, { name: 'content_search_index' });

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
              },
              {
                "type": "filter",
                "path": "memoryType"
              },
              {
                "type": "filter",
                "path": "tags"
              },
              {
                "type": "filter",
                "path": "lastModified"
              },
              {
                "type": "filter",
                "path": "metadata.aiContextType"
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
      await this.safeCreateIndex(projectsCollection, { name: 1 }, { unique: true, name: 'project_name_unique' });
      await this.safeCreateIndex(projectsCollection, { lastAccessed: -1 }, { name: 'last_accessed_index' });

      console.log('[MongoDB] All indexes created successfully');
    } catch (error) {
      console.error('[MongoDB] Error creating indexes:', error);
      console.log('[MongoDB] Continuing without perfect indexes...');
    }
  }

  /**
   * 🔧 SAFE INDEX CREATION: Handle existing indexes gracefully
   */
  private async safeCreateIndex(collection: any, keys: any, options: any = {}): Promise<void> {
    try {
      await collection.createIndex(keys, options);
      console.log(`[MongoDB] Created index: ${options.name || 'unnamed'}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`[MongoDB] Index already exists: ${options.name || 'unnamed'}, skipping`);
      } else {
        console.warn(`[MongoDB] Failed to create index ${options.name || 'unnamed'}:`, error.message);
      }
    }
  }
}
