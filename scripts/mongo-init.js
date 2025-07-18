// MongoDB initialization script for Memory Bank MCP Server
// This script sets up the database and creates initial indexes

// Switch to memory_bank database
db = db.getSiblingDB('memory_bank');

// Create collections
db.createCollection('memories');
db.createCollection('projects');

// Create indexes for memories collection
db.memories.createIndex({ "projectName": 1, "fileName": 1 }, { unique: true });
db.memories.createIndex({ "projectName": 1 });
db.memories.createIndex({ "tags": 1 });
db.memories.createIndex({ "lastModified": -1 });

// Create text search index
db.memories.createIndex({ 
  "content": "text", 
  "fileName": "text",
  "tags": "text"
});

// Create indexes for projects collection
db.projects.createIndex({ "name": 1 }, { unique: true });
db.projects.createIndex({ "lastAccessed": -1 });

print("MongoDB Memory Bank database initialized successfully!");
print("Collections created: memories, projects");
print("Indexes created for optimal performance");
print("Ready for Memory Bank MCP Server!");
