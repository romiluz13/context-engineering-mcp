# MongoDB Memory Bank MCP Server

A Model Context Protocol (MCP) server that provides persistent memory storage using MongoDB as the backend. This allows AI assistants to store, retrieve, and search through project-specific documentation and notes across sessions.

[![npm version](https://badge.fury.io/js/mongodb-memory-bank-mcp.svg)](https://www.npmjs.com/package/mongodb-memory-bank-mcp)
[![npm downloads](https://img.shields.io/npm/dm/mongodb-memory-bank-mcp.svg)](https://www.npmjs.com/package/mongodb-memory-bank-mcp)

## What This Does

This MCP server enables AI assistants to:
- Store and retrieve project documentation and notes
- Automatically organize memories by project with complete isolation
- Search through stored content using text search or semantic search (Atlas only)
- Maintain structured documentation templates (like projectbrief.md, activecontext.md)
- Auto-generate missing template files when needed

## Key Features

### MongoDB Backend
- Uses MongoDB for reliable, scalable storage
- Supports both MongoDB Atlas (cloud) and Community Edition (local)
- Automatic project detection and isolation
- Fast text search with MongoDB's text indexes

### Template Intelligence
- Automatically detects common documentation patterns (projectbrief.md, activecontext.md, etc.)
- Creates missing foundation files when dependencies are detected
- Maintains relationships between different types of documentation

### Search Capabilities
- **MongoDB Community**: Fast text search across all stored content
- **MongoDB Atlas**: Hybrid search combining text and semantic search using vector embeddings
- Related memory discovery based on content similarity and tags

## Installation

```bash
npm install -g mongodb-memory-bank-mcp
```

## Setup

### Option 1: MongoDB Atlas (Recommended)
Provides full features including semantic search with vector embeddings.

1. Create a MongoDB Atlas cluster (free tier available)
2. Get your connection string from Atlas
3. Sign up for Voyage AI API key for embeddings
4. Configure environment variables (see Configuration section)

### Option 2: Local MongoDB Community
Provides core functionality with text search.

1. Install and start MongoDB Community Edition locally
2. Use connection string: `mongodb://localhost:27017`
3. Configure environment variables (see Configuration section)

## Configuration

### Environment Variables

```env
# Required
MONGODB_URI=mongodb://localhost:27017  # or your Atlas connection string
MONGODB_DATABASE=memory_bank

# Optional - for Atlas semantic search
MONGODB_ATLAS=true
ENABLE_VECTOR_SEARCH=true
VOYAGE_API_KEY=your_voyage_api_key
```

### MCP Client Setup

#### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory-bank": {
      "command": "npx",
      "args": ["-y", "mongodb-memory-bank-mcp"],
      "env": {
        "MONGODB_URI": "your_mongodb_connection_string",
        "MONGODB_DATABASE": "memory_bank",
        "VOYAGE_API_KEY": "your_voyage_api_key"
      }
    }
  }
}
```

#### Other MCP Clients
Use the same environment variables in your MCP client configuration.

## Available MCP Tools

### Core Operations
- `list_projects` - List all projects in the memory bank
- `list_project_files` - List all files within a specific project
- `memory_bank_read` - Read the content of a specific memory file
- `memory_bank_write` - Create or update a memory file
- `memory_search` - Search across all memories with text or semantic search

### Advanced Features
- `memory_discover` - Find memories related to a specific file
- `detect_project_context_secure_mongodb-memory-bank` - Detect current project context

## How It Works

### Automatic Project Detection
The server automatically detects which project you're working on based on:
- Current working directory
- Git repository information
- Package.json or other project files
- Directory structure patterns

Each project's memories are completely isolated from others.

### Template Intelligence
When you create common documentation files, the system automatically:
- Detects the template type (project brief, active context, system patterns, etc.)
- Creates missing foundation files if needed
- Establishes relationships between related files
- Applies appropriate tags and metadata

### Example Workflow
1. Create `projectbrief.md` - System detects this as a project brief template
2. Create `activecontext.md` - System automatically creates missing `systempatterns.md` and `techcontext.md` if they don't exist
3. Update `activecontext.md` - System can automatically update `progress.md` based on changes
4. Search for "authentication" - System searches across all project files and finds relevant content

## Architecture

### Storage
- All memories stored in MongoDB collections
- Each project gets isolated storage
- Automatic indexing for fast text search
- Optional vector embeddings for semantic search (Atlas only)

### Performance
- Text search: ~50-200ms for thousands of documents
- Memory retrieval: ~10-50ms per document
- Semantic search: ~50-150ms (Atlas with vector search)
- Concurrent access supported

### Data Structure
Each memory document contains:
- Project name and file name
- Content and metadata (word count, timestamps)
- Auto-generated tags
- Template type and relationships (if applicable)
- Vector embeddings (Atlas only)

## Why MongoDB Instead of Files?

### Performance
- Fast indexed search instead of scanning files
- Concurrent access without file locking issues
- Efficient storage and retrieval at scale
- Rich query capabilities beyond simple text matching

### Reliability
- ACID transactions ensure data consistency
- Automatic backup and replication (Atlas)
- No file corruption or permission issues
- Built-in connection pooling and error handling

### Features
- Text search with relevance scoring
- Semantic search with vector embeddings (Atlas)
- Complex queries and aggregations
- Real-time indexing and updates

## Use Cases

### Development Documentation
- Project requirements and architecture decisions
- Code patterns and implementation notes
- Bug fixes and troubleshooting guides
- API documentation and integration patterns

### Knowledge Management
- Meeting notes and team decisions
- Research findings and technical insights
- Learning notes and skill development
- Best practices and coding standards

### AI Assistant Memory
- Persistent context across sessions
- Project-specific knowledge retention
- Automatic organization and tagging
- Intelligent content relationships

## Security

- Input validation and sanitization on all operations
- Path security validation to prevent directory traversal
- MongoDB injection prevention
- Secure connection handling with proper error management

## Requirements

- Node.js 18+
- MongoDB Community Edition 4.4+ or MongoDB Atlas
- For semantic search: MongoDB Atlas with vector search enabled
- For embeddings: Voyage AI API key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Dependencies

- **MongoDB**: Database backend
- **Voyage AI**: Vector embeddings for semantic search (Atlas only)
- **Model Context Protocol**: AI tool integration standard
