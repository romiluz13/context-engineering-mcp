#!/usr/bin/env node

// Test the comprehensive setup tool
import { setupMemoryBankSystem } from './dist/presentation/mcp/tools/create-vector-search-index.js';

console.log('🧪 TESTING COMPREHENSIVE SETUP TOOL');
console.log('===================================');

async function testSetupTool() {
  try {
    const workingDirectory = '/Users/rom.iluz/Dev/context-engineering-mcp/context-engineering-mcp';
    console.log(`\n🎯 Testing setup for: ${workingDirectory}`);
    
    const result = await setupMemoryBankSystem(workingDirectory);
    
    console.log('\n📊 SETUP RESULTS:');
    console.log('================');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS: System is fully configured and ready!');
    } else {
      console.log('\n⚠️  ISSUES FOUND - See recommendations above');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

testSetupTool();
