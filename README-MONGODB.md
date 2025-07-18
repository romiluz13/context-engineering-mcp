# MongoDB Memory Bank MCP Server

A powerful Memory Bank MCP server powered by MongoDB, featuring hybrid search, semantic discovery, and AI-powered memory management.

## 🚀 Features

### Core Capabilities
- **MongoDB-Native Storage**: All memories stored in MongoDB (Atlas or Community)
- **Hybrid Search**: Text + vector search using MongoDB's $rankFusion (Atlas only)
- **Semantic Discovery**: Find related memories using Voyage AI embeddings
- **Auto-Tagging**: Intelligent tag generation for better organization
- **Real-time Search**: Sub-second search across thousands of memories

### MCP Tools
1. `list_projects` - List all projects in MongoDB
2. `list_project_files` - List memory files in a project
3. `memory_bank_read` - Read memory content from MongoDB
4. `memory_bank_write` - Create new memory with auto-tagging
5. `memory_bank_update` - Update existing memory
6. `memory_store` - Enhanced memory storage with MongoDB features
7. `memory_search` - Hybrid/text search across memories
8. `memory_load` - Load specific memory files
9. `memory_discover` - Find related memories

## 🛠 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (Atlas or Community)
- (Optional) Voyage AI API key for semantic search

### Quick Start

1. **Clone and Install**
```bash
git clone <repository>
cd context-engineering-mcp
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB settings
```

3. **Build and Run**
```bash
npm run build
npm start
```

## ⚙️ Configuration

### Environment Variables

#### Basic Configuration
```env
# Storage mode (always use 'mongodb' for this version)
STORAGE_MODE=mongodb

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=memory_bank
```

#### MongoDB Atlas (Full Features)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_ATLAS=true
ENABLE_VECTOR_SEARCH=true
VOYAGE_API_KEY=your_voyage_api_key
```

#### MongoDB Community (Core Features)
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_ATLAS=false
ENABLE_VECTOR_SEARCH=false
```

### Deployment Modes

#### 🌟 Atlas Mode (Recommended)
- **Full hybrid search** with $rankFusion
- **Vector embeddings** with Voyage AI
- **Advanced analytics** and insights
- **Managed infrastructure**

**Setup:**
1. Create MongoDB Atlas cluster
2. Get connection string
3. Set `MONGODB_ATLAS=true`
4. Add Voyage AI API key
5. Enable vector search

#### 🏠 Community Mode
- **Document storage** and indexing
- **Text search** capabilities
- **Basic analytics**
- **Local development friendly**

**Setup:**
1. Install MongoDB Community
2. Set `MONGODB_URI=mongodb://localhost:27017`
3. Set `MONGODB_ATLAS=false`

## 🔧 MCP Client Integration

### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "memory-bank-mongodb": {
      "command": "node",
      "args": ["/path/to/context-engineering-mcp/dist/main/index.js"],
      "env": {
        "STORAGE_MODE": "mongodb",
        "MONGODB_URI": "your_mongodb_uri",
        "MONGODB_DATABASE": "memory_bank"
      }
    }
  }
}
```

### Cursor/Windsurf/VS Code
Configure in your MCP settings with the same environment variables.

## 📊 MongoDB Advantages

### vs File Storage
- **Search**: Instant text/semantic search vs grep-only
- **Scalability**: Horizontal scaling vs linear degradation  
- **Performance**: Sub-millisecond responses vs I/O bound
- **Analytics**: Rich aggregation pipelines vs none
- **Relationships**: Document model vs isolated files

### Hybrid Search Power
```javascript
// Single query combines text + vector search
db.memories.aggregate([
  {
    $rankFusion: {
      input: {
        pipelines: [
          [{ $search: { text: { query: "authentication" } } }],
          [{ $vectorSearch: { queryVector: [...] } }]
        ]
      }
    }
  }
])
```

## 🚀 Usage Examples

### Store Memory with Auto-Tagging
```json
{
  "tool": "memory_store",
  "arguments": {
    "projectName": "my-app",
    "fileName": "auth-strategy.md",
    "content": "JWT authentication implementation with refresh tokens and secure storage patterns",
    "tags": ["auth", "security", "jwt"]
  }
}
```

### Hybrid Search (Atlas Only)
```json
{
  "tool": "memory_search",
  "arguments": {
    "query": "authentication security",
    "projectName": "my-app",
    "useSemanticSearch": true,
    "limit": 10
  }
}
```

### Text Search (Community & Atlas)
```json
{
  "tool": "memory_search",
  "arguments": {
    "query": "database configuration",
    "projectName": "my-app",
    "tags": ["mongodb", "config"],
    "limit": 5
  }
}
```

### Load Specific Memory
```json
{
  "tool": "memory_load",
  "arguments": {
    "projectName": "my-app",
    "fileName": "auth-strategy.md"
  }
}
```

### Discover Related Memories
```json
{
  "tool": "memory_discover",
  "arguments": {
    "projectName": "my-app",
    "fileName": "auth-strategy.md",
    "limit": 5
  }
}
```

### List All Projects
```json
{
  "tool": "list_projects",
  "arguments": {}
}
```

### List Project Files
```json
{
  "tool": "list_project_files",
  "arguments": {
    "projectName": "my-app"
  }
}
```

## 🔒 Security

- Input validation and sanitization
- Path security validation
- MongoDB injection prevention
- Secure environment variable handling
- Rate limiting ready

## 📈 Performance

- **Sub-second search** across thousands of memories
- **Intelligent indexing** for optimal query performance
- **Connection pooling** for high concurrency
- **Caching strategies** for frequently accessed data

## 🤝 Contributing

1. Follow existing MCP patterns exactly
2. Ensure MongoDB is the only source of truth
3. Test with both Atlas and Community
4. Update documentation

## 📄 License

Same as original Memory Bank MCP server.
