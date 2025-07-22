import { MongoDBConnection } from '../../../infra/mongodb/connection/mongodb-connection.js';
import { getCollectionNames, mongoConfig } from '../../../main/config/mongodb-config.js';
import { VoyageEmbeddingService } from '../../../infra/ai/voyage-embedding-service.js';
import { detectProjectForMCP } from '../../../shared/utils/project-name-normalizer.js';
import { createMongoDBIndexes, listMongoDBIndexes } from './mongodb-index-manager.js';

export interface SystemSetupResult {
  success: boolean;
  message: string;
  details: {
    projectDetection: {
      success: boolean;
      projectName: string;
      workingDirectory: string;
      confidence: number;
      message: string;
    };
    environment: {
      success: boolean;
      mongodbAtlas: boolean;
      enableVectorSearch: boolean;
      voyageApiKey: boolean;
      message: string;
    };
    vectorIndex: {
      success: boolean;
      indexName?: string;
      status: 'created' | 'exists' | 'failed' | 'not-needed';
      message: string;
    };
    vectorStorage: {
      success: boolean;
      embeddingServiceAvailable: boolean;
      testEmbedding: boolean;
      message: string;
    };
    databaseHealth: {
      success: boolean;
      connection: boolean;
      collections: number;
      memories: number;
      message: string;
    };
  };
  recommendations: string[];
}

export async function setupMemoryBankSystem(workingDirectory: string = process.cwd()): Promise<SystemSetupResult> {
  console.log('🚀 COMPLETE MEMORY BANK SYSTEM SETUP');
  console.log('====================================');

  const result: SystemSetupResult = {
    success: false,
    message: '',
    details: {
      projectDetection: {
        success: false,
        projectName: '',
        workingDirectory: '',
        confidence: 0,
        message: ''
      },
      environment: {
        success: false,
        mongodbAtlas: false,
        enableVectorSearch: false,
        voyageApiKey: false,
        message: ''
      },
      vectorIndex: {
        success: false,
        status: 'failed',
        message: ''
      },
      vectorStorage: {
        success: false,
        embeddingServiceAvailable: false,
        testEmbedding: false,
        message: ''
      },
      databaseHealth: {
        success: false,
        connection: false,
        collections: 0,
        memories: 0,
        message: ''
      }
    },
    recommendations: []
  };

  // Step 1: Project Detection
  console.log('\n🎯 Step 1: Project Detection & Context');
  console.log('-------------------------------------');

  try {
    // Use the more robust detectProjectFromPath directly with working directory
    const detection = (await import('../../../shared/utils/project-name-normalizer.js')).detectProjectFromPath(workingDirectory);

    result.details.projectDetection = {
      success: true,
      projectName: detection.projectName,
      workingDirectory: workingDirectory,
      confidence: detection.confidence,
      message: `✅ Project detected: "${detection.projectName}" (${detection.detectionMethod}, ${detection.confidence}% confidence)`
    };
    console.log(result.details.projectDetection.message);
    console.log(`🔍 Project Detection Details:`, {
      workingDirectory,
      projectName: detection.projectName,
      method: detection.detectionMethod,
      confidence: detection.confidence
    });
  } catch (error: any) {
    result.details.projectDetection.message = `❌ Project detection failed: ${error.message}`;
    console.log(result.details.projectDetection.message);
    result.recommendations.push('Fix project detection by ensuring you are in a valid project directory');
  }

  // Step 2: Environment Variables
  console.log('\n🔧 Step 2: Environment Configuration');
  console.log('-----------------------------------');

  const mongodbAtlas = mongoConfig.isAtlas;
  const enableVectorSearch = mongoConfig.enableVectorSearch;
  const voyageApiKey = !!mongoConfig.voyageApiKey;

  result.details.environment = {
    success: mongodbAtlas && enableVectorSearch && voyageApiKey,
    mongodbAtlas,
    enableVectorSearch,
    voyageApiKey,
    message: `MongoDB Atlas: ${mongodbAtlas ? '✅' : '❌'}, Vector Search: ${enableVectorSearch ? '✅' : '❌'}, Voyage API: ${voyageApiKey ? '✅' : '❌'}`
  };

  console.log(result.details.environment.message);

  if (!result.details.environment.success) {
    if (!mongodbAtlas) result.recommendations.push('Set MONGODB_ATLAS=true in .mcp.json');
    if (!enableVectorSearch) result.recommendations.push('Set ENABLE_VECTOR_SEARCH=true in .mcp.json');
    if (!voyageApiKey) result.recommendations.push('Set VOYAGE_API_KEY in .mcp.json');
  }

  // Step 3: Database Health Check
  console.log('\n🔗 Step 3: Database Connection & Health');
  console.log('--------------------------------------');

  try {
    const db = await MongoDBConnection.getInstance().getDatabase();
    const memoriesCollection = db.collection(getCollectionNames().memories);
    const projectsCollection = db.collection(getCollectionNames().projects);

    const memoriesCount = await memoriesCollection.countDocuments({});
    const projectMemoriesCount = result.details.projectDetection.success
      ? await memoriesCollection.countDocuments({ projectName: result.details.projectDetection.projectName })
      : 0;

    result.details.databaseHealth = {
      success: true,
      connection: true,
      collections: 2,
      memories: memoriesCount,
      message: `✅ Database connected. Total memories: ${memoriesCount}, Current project: ${projectMemoriesCount}`
    };

    console.log(result.details.databaseHealth.message);
  } catch (error: any) {
    result.details.databaseHealth.message = `❌ Database connection failed: ${error.message}`;
    console.log(result.details.databaseHealth.message);
    result.recommendations.push('Check MongoDB connection string and network connectivity');
  }

  // Step 4: Vector Storage Test
  console.log('\n🧠 Step 4: Vector Storage & Embedding Service');
  console.log('--------------------------------------------');

  try {
    const embeddingService = new VoyageEmbeddingService();
    const isAvailable = embeddingService.isAvailable();

    let testEmbedding = false;
    let apiConnectionTest = null;

    if (isAvailable) {
      // Test API connection first
      apiConnectionTest = await embeddingService.testApiConnection();

      if (apiConnectionTest.success) {
        // If API connection works, test actual embedding generation
        const testResult = await embeddingService.generateEmbedding('test content for setup validation');
        testEmbedding = !!testResult;
      }
    }

    result.details.vectorStorage = {
      success: isAvailable && testEmbedding,
      embeddingServiceAvailable: isAvailable,
      testEmbedding,
      message: `Embedding Service: ${isAvailable ? '✅' : '❌'}, API Connection: ${apiConnectionTest?.success ? '✅' : '❌'}, Test Embedding: ${testEmbedding ? '✅' : '❌'}`
    };

    console.log(result.details.vectorStorage.message);

    if (apiConnectionTest && !apiConnectionTest.success) {
      console.log('🚨 API Connection Details:', apiConnectionTest);
    }

    if (!result.details.vectorStorage.success) {
      if (!isAvailable) result.recommendations.push('Fix environment variables for vector search');
      if (apiConnectionTest && !apiConnectionTest.success) {
        result.recommendations.push(`Voyage AI API Error: ${apiConnectionTest.error}`);
      }
      if (!testEmbedding) result.recommendations.push('Check Voyage AI API key and connectivity');
    }
  } catch (error: any) {
    result.details.vectorStorage.message = `❌ Vector storage test failed: ${error.message}`;
    console.log(result.details.vectorStorage.message);
    result.recommendations.push('Debug vector storage configuration');
  }

  // Step 5: MongoDB Indexes (Following Official Patterns)
  console.log('\n🔍 Step 5: MongoDB Indexes Setup');
  console.log('----------------------------------');

  try {
    // Use official MongoDB patterns for index creation
    const indexResult = await createMongoDBIndexes();

    if (indexResult.success) {
      result.details.vectorIndex = {
        success: true,
        indexName: indexResult.indexes.vectorSearch?.name || 'text_search_index',
        status: 'created',
        message: `✅ ${indexResult.message}`
      };

      // Add index details to recommendations for user info
      if (indexResult.indexes.vectorSearch?.created) {
        result.recommendations.push('✅ Vector search index created - semantic search enabled');
      }
      if (indexResult.indexes.textSearch?.created) {
        result.recommendations.push('✅ Text search index created - keyword search enabled');
      }
      if (indexResult.indexes.compound?.created) {
        result.recommendations.push('✅ Compound indexes created - query performance optimized');
      }
    } else {
      result.details.vectorIndex = {
        success: false,
        status: 'failed',
        message: `⚠️ ${indexResult.message}`
      };

      // Add specific recommendations from index creation
      result.recommendations.push(...indexResult.recommendations);
    }

    console.log(result.details.vectorIndex.message);

  } catch (error: any) {
    result.details.vectorIndex = {
      success: false,
      status: 'failed',
      message: `❌ Index setup failed: ${error.message}`
    };
    console.log(result.details.vectorIndex.message);
    result.recommendations.push('Check MongoDB connection and permissions for index creation');
  }

  // Final Assessment
  console.log('\n📊 SYSTEM SETUP SUMMARY');
  console.log('======================');

  const allSuccess = result.details.projectDetection.success &&
                    result.details.environment.success &&
                    result.details.databaseHealth.success &&
                    result.details.vectorStorage.success &&
                    result.details.vectorIndex.success;

  result.success = allSuccess;

  if (allSuccess) {
    result.message = `🎉 COMPLETE SUCCESS! Memory Bank system is fully configured and ready.`;
    console.log(result.message);
    console.log(`\n✅ Project: ${result.details.projectDetection.projectName}`);
    console.log(`✅ Database: Connected with ${result.details.databaseHealth.memories} memories`);
    console.log(`✅ Vector Search: ${result.details.vectorIndex.status}`);
    console.log(`✅ Embeddings: Working with Voyage AI`);
  } else {
    const issues = [];
    if (!result.details.projectDetection.success) issues.push('Project Detection');
    if (!result.details.environment.success) issues.push('Environment Config');
    if (!result.details.databaseHealth.success) issues.push('Database Connection');
    if (!result.details.vectorStorage.success) issues.push('Vector Storage');
    if (!result.details.vectorIndex.success) issues.push('Vector Index');

    result.message = `⚠️  Setup incomplete. Issues found: ${issues.join(', ')}`;
    console.log(result.message);

    if (result.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      result.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
  }

  return result;
}
