#!/usr/bin/env node

// Complete Vector Storage Pipeline Test
import https from 'https';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://romiluz:05101994@contextengineering.hdx0p3f.mongodb.net/?retryWrites=true&w=majority&appName=contextengineering';
const VOYAGE_API_KEY = 'pa-DYq4PcQa7Jv6zyYndGs7h203STXggThgPpyZHmexuNE';

console.log('🧪 COMPLETE VECTOR STORAGE PIPELINE TEST');
console.log('==========================================');

async function testEnvironmentVariables() {
  console.log('\n📋 Test 1: Environment Variables');
  console.log('--------------------------------');
  
  const env = {
    MONGODB_ATLAS: process.env.MONGODB_ATLAS,
    ENABLE_VECTOR_SEARCH: process.env.ENABLE_VECTOR_SEARCH,
    VOYAGE_API_KEY: process.env.VOYAGE_API_KEY ? 'PRESENT' : 'MISSING'
  };
  
  console.log('Environment Variables:', env);
  
  // Test expected values
  const expected = {
    MONGODB_ATLAS: 'true',
    ENABLE_VECTOR_SEARCH: 'true',
    VOYAGE_API_KEY: 'PRESENT'
  };
  
  let allGood = true;
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (env[key] !== expectedValue) {
      console.log(`❌ ${key}: Expected "${expectedValue}", got "${env[key]}"`);
      allGood = false;
    } else {
      console.log(`✅ ${key}: ${env[key]}`);
    }
  }
  
  return allGood;
}

async function testVoyageAPI() {
  console.log('\n🚀 Test 2: Voyage AI API');
  console.log('------------------------');
  
  return new Promise((resolve) => {
    const data = JSON.stringify({
      input: ['test content for vector generation'],
      model: 'voyage-3.5', // Updated model
      input_type: 'document'
    });

    const options = {
      hostname: 'api.voyageai.com',
      port: 443,
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.data && parsed.data[0] && parsed.data[0].embedding) {
            console.log('✅ SUCCESS: Voyage AI API working!');
            console.log(`   Model: voyage-3.5`);
            console.log(`   Vector dimensions: ${parsed.data[0].embedding.length}`);
            console.log(`   First 5 values: [${parsed.data[0].embedding.slice(0, 5).join(', ')}...]`);
            console.log(`   Tokens used: ${parsed.usage?.total_tokens || 'unknown'}`);
            resolve(true);
          } else {
            console.log('❌ FAILED: No embedding in response');
            console.log('Response:', responseData.substring(0, 200));
            resolve(false);
          }
        } catch (error) {
          console.log('❌ FAILED: Invalid JSON response');
          console.log('Raw response:', responseData.substring(0, 200));
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ FAILED: Request error');
      console.error('   Error:', error.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

async function testMongoDBConnection() {
  console.log('\n🔗 Test 3: MongoDB Connection & Vector Index');
  console.log('--------------------------------------------');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ MongoDB connection successful');
    
    const db = client.db('memory_bank');
    const collection = db.collection('memories');
    
    // Test basic collection access
    const count = await collection.countDocuments({ projectName: 'context-engineering-mcp' });
    console.log(`✅ Found ${count} memories in context-engineering-mcp project`);
    
    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('📋 Existing indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Try to create vector search index
    try {
      console.log('🔍 Attempting to create Atlas Vector Search Index...');
      const result = await collection.createSearchIndex(
        "vector_index_test",
        "vectorSearch",
        {
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
      );
      console.log('✅ Vector search index created:', result);
    } catch (indexError) {
      if (indexError.message.includes('already exists')) {
        console.log('ℹ️  Vector search index already exists');
      } else {
        console.log('⚠️  Vector search index creation failed:', indexError.message);
        console.log('   This is expected for Community deployments');
      }
    }
    
    // Check sample document for vector content
    const sample = await collection.findOne(
      { projectName: 'context-engineering-mcp' },
      { projection: { fileName: 1, contentVector: 1 } }
    );
    
    if (sample) {
      console.log('📄 Sample document:');
      console.log(`   File: ${sample.fileName}`);
      console.log(`   Has vector: ${!!sample.contentVector}`);
      console.log(`   Vector dimensions: ${sample.contentVector?.length || 0}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  } finally {
    await client.close();
  }
}

async function runCompleteTest() {
  console.log('🎯 Starting Complete Vector Storage Pipeline Test...\n');
  
  const results = {
    environment: await testEnvironmentVariables(),
    voyageAPI: await testVoyageAPI(),
    mongodb: await testMongoDBConnection()
  };
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
    if (!passed) allPassed = false;
  }
  
  console.log('\n🎯 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Run the MCP server: npm start');
    console.log('2. Test vector storage with: memory_bank_write');
    console.log('3. Test hybrid search with: memory_search (useSemanticSearch: true)');
    console.log('4. Create vector index with: create_vector_search_index');
  } else {
    console.log('\n🔧 FIXES NEEDED:');
    if (!results.environment) console.log('- Fix environment variables in .mcp.json');
    if (!results.voyageAPI) console.log('- Check Voyage AI API key and connectivity');
    if (!results.mongodb) console.log('- Check MongoDB Atlas connection and permissions');
  }
}

// Run the complete test
runCompleteTest().catch(console.error);
