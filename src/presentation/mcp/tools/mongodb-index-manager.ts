/**
 * MongoDB Index Manager - Programmatic Index Creation
 * 
 * Following EXACT MongoDB official patterns for programmatic index creation:
 * 1. Vector Search Index (Atlas) - using createSearchIndex with type: "vectorSearch"
 * 2. Text Search Index - using createIndex for text search
 * 3. Compound Indexes - for efficient filtering and sorting
 * 
 * Based on official MongoDB documentation:
 * - https://www.mongodb.com/docs/drivers/node/current/indexes/
 * - https://www.mongodb.com/docs/atlas/atlas-search/manage-indexes/
 * - MongoDB Node.js Driver v6.17+ patterns
 * - Community forum examples: https://www.mongodb.com/community/forums/t/can-i-create-a-vectorsearch-index-with-createsearchindex-command/265546
 */

import { MongoDBConnection } from '../../../infra/mongodb/connection/mongodb-connection.js';
import { getCollectionNames } from '../../../main/config/mongodb-config.js';

export interface IndexCreationResult {
  success: boolean;
  message: string;
  indexes: {
    vectorSearch?: {
      created: boolean;
      name: string;
      status: string;
      message: string;
    };
    textSearch?: {
      created: boolean;
      name: string;
      status: string;
      message: string;
    };
    compound?: {
      created: boolean;
      indexes: Array<{
        name: string;
        fields: Record<string, number>;
        status: string;
      }>;
    };
  };
  recommendations: string[];
}

/**
 * Creates MongoDB indexes following official patterns
 * Supports both Atlas (with vector search) and Community Edition
 */
export async function createMongoDBIndexes(): Promise<IndexCreationResult> {
  const result: IndexCreationResult = {
    success: false,
    message: '',
    indexes: {},
    recommendations: []
  };

  try {
    console.log('🔧 Creating MongoDB indexes using official patterns...');
    
    const mongoConnection = MongoDBConnection.getInstance();
    const db = await mongoConnection.getDatabase();
    const collectionNames = getCollectionNames();
    const memoriesCollection = collectionNames.memories;
    const projectsCollection = collectionNames.projects;
    
    const memoriesCol = db.collection(memoriesCollection);
    const projectsCol = db.collection(projectsCollection);

    // 1. VECTOR SEARCH INDEX (Atlas only)
    // Following official Node.js driver pattern from MongoDB docs
    try {
      console.log('📊 Creating Vector Search Index (Atlas)...');
      
      const vectorSearchIndex = {
        name: "vector_search_index",
        type: "vectorSearch",
        definition: {
          fields: [{
            path: "contentVector",
            type: "vector",
            numDimensions: 1024, // Voyage AI embedding dimensions
            similarity: "cosine"
          }]
        }
      };

      // Use official createSearchIndex method
      await memoriesCol.createSearchIndex(vectorSearchIndex);
      
      result.indexes.vectorSearch = {
        created: true,
        name: "vector_search_index",
        status: "created",
        message: "✅ Vector search index created successfully using createSearchIndex()"
      };
      
      console.log('✅ Vector search index created');
      
    } catch (vectorError: any) {
      console.log('⚠️ Vector search index creation failed (expected for non-Atlas):', vectorError.message);
      
      result.indexes.vectorSearch = {
        created: false,
        name: "vector_search_index",
        status: "failed",
        message: `Vector search not available: ${vectorError.message}`
      };
      
      if (vectorError.message.includes('command not found') || 
          vectorError.message.includes('not supported')) {
        result.recommendations.push('Vector search requires MongoDB Atlas M10+ cluster');
        result.recommendations.push('For local development, text search will be used instead');
      }
    }

    // 2. TEXT SEARCH INDEX
    // Following official createIndex pattern for text search
    try {
      console.log('📝 Creating Text Search Index...');
      
      const textIndexResult = await memoriesCol.createIndex(
        { 
          content: "text", 
          fileName: "text",
          summary: "text",
          tags: "text"
        },
        { 
          name: "text_search_index",
          default_language: "english",
          weights: { 
            content: 10, 
            summary: 5, 
            fileName: 3,
            tags: 2
          }
        }
      );
      
      result.indexes.textSearch = {
        created: true,
        name: "text_search_index",
        status: "created",
        message: `✅ Text search index created: ${textIndexResult}`
      };
      
      console.log('✅ Text search index created');
      
    } catch (textError: any) {
      console.log('❌ Text search index creation failed:', textError.message);
      
      result.indexes.textSearch = {
        created: false,
        name: "text_search_index", 
        status: "failed",
        message: `Text search index failed: ${textError.message}`
      };
    }

    // 3. COMPOUND INDEXES
    // Following official createIndex patterns for compound indexes
    try {
      console.log('🔗 Creating Compound Indexes...');
      
      const compoundIndexes = [
        {
          name: "project_filename_index",
          fields: { projectName: 1, fileName: 1 } as Record<string, number>,
          options: { unique: true }
        },
        {
          name: "project_modified_index",
          fields: { projectName: 1, lastModified: -1 } as Record<string, number>
        },
        {
          name: "project_tags_index",
          fields: { projectName: 1, tags: 1 } as Record<string, number>
        },
        {
          name: "memory_type_index",
          fields: { projectName: 1, memoryType: 1, lastModified: -1 } as Record<string, number>
        }
      ];

      const compoundResults = [];
      
      for (const index of compoundIndexes) {
        try {
          const indexResult = await memoriesCol.createIndex(
            index.fields,
            { name: index.name, ...index.options }
          );
          
          compoundResults.push({
            name: index.name,
            fields: index.fields,
            status: `created: ${indexResult}`
          });
          
          console.log(`✅ Compound index created: ${index.name}`);
          
        } catch (indexError: any) {
          compoundResults.push({
            name: index.name,
            fields: index.fields,
            status: `failed: ${indexError.message}`
          });
          
          console.log(`⚠️ Compound index failed: ${index.name} - ${indexError.message}`);
        }
      }

      result.indexes.compound = {
        created: compoundResults.some(r => r.status.includes('created')),
        indexes: compoundResults
      };
      
    } catch (compoundError: any) {
      console.log('❌ Compound indexes creation failed:', compoundError.message);
    }

    // 4. PROJECT COLLECTION INDEXES
    try {
      console.log('📁 Creating Project Collection Indexes...');
      
      await projectsCol.createIndex({ projectName: 1 }, { unique: true });
      await projectsCol.createIndex({ lastAccessed: -1 });
      await projectsCol.createIndex({ status: 1, lastAccessed: -1 });
      
      console.log('✅ Project collection indexes created');
      
    } catch (projectError: any) {
      console.log('⚠️ Project indexes creation failed:', projectError.message);
    }

    // Determine overall success
    const hasWorkingSearch = result.indexes.vectorSearch?.created || result.indexes.textSearch?.created;
    const hasCompoundIndexes = result.indexes.compound?.created || false;

    result.success = (hasWorkingSearch || false) && hasCompoundIndexes;
    
    if (result.success) {
      result.message = '🎉 MongoDB indexes created successfully using official patterns';
      result.recommendations.push('Indexes are ready for hybrid search operations');
      result.recommendations.push('Use memory_search tool to test search functionality');
    } else {
      result.message = '⚠️ Some indexes failed to create - check individual status';
      result.recommendations.push('Review error messages and MongoDB configuration');
      result.recommendations.push('Ensure proper MongoDB version and permissions');
    }

    return result;

  } catch (error: any) {
    console.error('❌ Index creation failed:', error);
    
    result.success = false;
    result.message = `Index creation failed: ${error.message}`;
    result.recommendations.push('Check MongoDB connection and permissions');
    result.recommendations.push('Verify MongoDB version supports required index types');
    
    return result;
  }
}

/**
 * Alternative Vector Search Index Creation using MongoDB Atlas Admin API
 * For cases where driver method fails or for more control
 * Based on: https://www.mongodb.com/docs/atlas/reference/api/fts-indexes/
 */
export async function createVectorSearchIndexViaAPI(
  clusterName: string,
  databaseName: string,
  collectionName: string,
  apiKey?: string,
  projectId?: string
): Promise<any> {
  try {
    console.log('🌐 Creating Vector Search Index via Atlas Admin API...');

    if (!apiKey || !projectId) {
      return {
        success: false,
        message: 'Atlas Admin API requires API key and project ID',
        recommendation: 'Use driver method instead or provide Atlas credentials'
      };
    }

    // Atlas Admin API endpoint for creating search indexes
    const apiUrl = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/clusters/${clusterName}/fts/indexes`;

    const indexDefinition = {
      name: "vector_search_index_api",
      type: "vectorSearch",
      database: databaseName,
      collectionName: collectionName,
      definition: {
        fields: [{
          path: "contentVector",
          type: "vector",
          numDimensions: 1024,
          similarity: "cosine"
        }]
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(indexDefinition)
    });

    if (response.ok) {
      const result: any = await response.json();
      return {
        success: true,
        message: 'Vector search index created via Atlas Admin API',
        indexId: result.indexId,
        status: result.status
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `Atlas API error: ${response.status} - ${error}`,
        recommendation: 'Check API credentials and cluster configuration'
      };
    }

  } catch (error: any) {
    console.error('❌ Atlas API index creation failed:', error);
    return {
      success: false,
      message: `Atlas API failed: ${error.message}`,
      recommendation: 'Use driver method instead'
    };
  }
}

/**
 * Alternative using MongoDB command for older versions
 * Based on community forum examples
 */
export async function createVectorSearchIndexViaCommand(): Promise<any> {
  try {
    console.log('⚙️ Creating Vector Search Index via MongoDB command...');

    const mongoConnection = MongoDBConnection.getInstance();
    const db = await mongoConnection.getDatabase();
    const collectionNames = getCollectionNames();
    const memoriesCollection = collectionNames.memories;

    // Using the command approach from community forums
    const command = {
      createSearchIndexes: memoriesCollection,
      indexes: [{
        name: "vector_search_index_cmd",
        type: "vectorSearch",
        definition: {
          fields: [{
            path: "contentVector",
            type: "vector",
            numDimensions: 1024,
            similarity: "cosine"
          }]
        }
      }]
    };

    const result = await db.command(command);

    return {
      success: true,
      message: 'Vector search index created via MongoDB command',
      result: result
    };

  } catch (error: any) {
    console.error('❌ Command-based index creation failed:', error);
    return {
      success: false,
      message: `Command failed: ${error.message}`,
      recommendation: 'This method requires MongoDB Atlas M10+ cluster'
    };
  }
}

/**
 * Lists all indexes on memory bank collections
 * Following official listIndexes() pattern
 */
export async function listMongoDBIndexes(): Promise<any> {
  try {
    const mongoConnection = MongoDBConnection.getInstance();
    const db = await mongoConnection.getDatabase();
    const collectionNames = getCollectionNames();
    const memoriesCollection = collectionNames.memories;
    const projectsCollection = collectionNames.projects;

    const memoriesCol = db.collection(memoriesCollection);
    const projectsCol = db.collection(projectsCollection);

    console.log('📋 Listing MongoDB indexes...');

    const memoriesIndexes = await memoriesCol.listIndexes().toArray();
    const projectsIndexes = await projectsCol.listIndexes().toArray();

    // Also try to list search indexes if available
    let searchIndexes: any[] = [];
    try {
      searchIndexes = await memoriesCol.listSearchIndexes().toArray();
      console.log(`📊 Found ${searchIndexes.length} search indexes`);
    } catch (searchError) {
      console.log('ℹ️ Search indexes not available (expected for non-Atlas)');
    }

    return {
      success: true,
      indexes: {
        memories: memoriesIndexes,
        projects: projectsIndexes,
        search: searchIndexes
      },
      message: `Found ${memoriesIndexes.length} memory indexes, ${projectsIndexes.length} project indexes, ${searchIndexes.length} search indexes`
    };

  } catch (error: any) {
    console.error('❌ Failed to list indexes:', error);
    return {
      success: false,
      message: `Failed to list indexes: ${error.message}`,
      indexes: {}
    };
  }
}
