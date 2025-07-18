# MongoDB Memory Bank MCP Server - Usage Examples

This document provides comprehensive examples of using the MongoDB Memory Bank MCP Server with various AI coding tools.

## Table of Contents
- [Basic Memory Operations](#basic-memory-operations)
- [Search and Discovery](#search-and-discovery)
- [Project Management](#project-management)
- [Real-World Scenarios](#real-world-scenarios)
- [AI Coding Tool Integration](#ai-coding-tool-integration)

## Basic Memory Operations

### Storing Memories

Store a new memory with automatic tagging:

```
Store this authentication strategy in my project:

Project: web-app
File: auth-implementation.md
Content: "We use JWT tokens with refresh token rotation. Access tokens expire in 15 minutes, refresh tokens in 7 days. Store tokens in httpOnly cookies for security."
```

The MCP server will automatically:
- Extract relevant tags (auth, jwt, security, tokens)
- Calculate word count
- Store in MongoDB with proper indexing

### Loading Memories

Retrieve a specific memory:

```
Load the auth-implementation.md file from my web-app project
```

### Updating Memories

Update existing memory content:

```
Update the auth-implementation.md in web-app project with this new content:
"Enhanced JWT implementation with Redis session store for scalability. Added rate limiting and brute force protection."
```

## Search and Discovery

### Text Search (Works with Community & Atlas)

```
Search for "database optimization" in my web-app project
```

### Semantic Search (Atlas Only)

```
Find memories related to "performance improvements" using semantic search
```

### Tag-Based Search

```
Find all memories tagged with "security" and "authentication"
```

### Related Memory Discovery

```
Find memories related to auth-implementation.md in my web-app project
```

## Project Management

### List All Projects

```
Show me all my projects in the memory bank
```

### List Project Files

```
List all memory files in my web-app project
```

### Project Statistics

```
Get statistics for my web-app project (total memories, word count, common tags)
```

## Real-World Scenarios

### Scenario 1: Code Review Documentation

```
Store this code review feedback:

Project: api-service
File: code-review-2024-01-15.md
Content: "Performance issues in user authentication endpoint. Recommend implementing connection pooling and adding Redis cache for session data. Also need to add input validation for email field."
```

### Scenario 2: Bug Investigation

```
Search for memories about "connection timeout" issues in api-service project
```

### Scenario 3: Architecture Decisions

```
Store this architecture decision:

Project: microservices
File: event-sourcing-decision.md
Content: "Decided to implement event sourcing for order management. Benefits: audit trail, temporal queries, replay capability. Challenges: complexity, eventual consistency. Using Apache Kafka for event store."
```

### Scenario 4: Learning Notes

```
Store these MongoDB optimization notes:

Project: database-learning
File: mongodb-indexing-best-practices.md
Content: "Compound indexes should follow ESR rule: Equality, Sort, Range. Use sparse indexes for optional fields. Monitor index usage with db.collection.getIndexes(). Avoid too many indexes as they slow writes."
```

## AI Coding Tool Integration

### Claude Desktop

1. Add server to `claude_desktop_config.json`
2. Restart Claude Desktop
3. Use natural language commands:

```
"Store this API design in my project"
"Find all memories about database performance"
"What did I learn about React hooks?"
```

### Cursor IDE

1. Configure MCP server in Cursor settings
2. Use in chat:

```
"@memory-bank search for authentication patterns"
"@memory-bank store this component design"
```

### Windsurf

1. Add to MCP configuration
2. Use contextual commands:

```
"Remember this debugging approach for future reference"
"Find similar issues I've solved before"
```

### VS Code with Cline

1. Configure MCP server
2. Use in Cline chat:

```
"Store this solution in memory bank"
"Search memory bank for error handling patterns"
```

## Advanced Usage Patterns

### Memory Organization Strategy

```
# Organize by project and topic
Project: web-app
├── auth-*.md (authentication related)
├── db-*.md (database related)
├── api-*.md (API design)
└── deploy-*.md (deployment notes)
```

### Tagging Strategy

Use consistent tags for better discovery:
- **Technology**: `react`, `nodejs`, `mongodb`, `docker`
- **Category**: `bug`, `feature`, `optimization`, `security`
- **Priority**: `critical`, `important`, `nice-to-have`
- **Status**: `todo`, `in-progress`, `done`, `archived`

### Search Optimization

1. **Use specific terms**: Instead of "fix", use "bug fix" or "performance fix"
2. **Combine filters**: Use project + tags + text search
3. **Leverage semantic search**: For conceptual queries (Atlas only)

### Memory Lifecycle

1. **Create**: Store with descriptive filename and relevant tags
2. **Update**: Keep memories current as solutions evolve
3. **Discover**: Use related memory discovery for context
4. **Archive**: Use tags to mark outdated memories

## Performance Tips

### For MongoDB Community
- Use text search with specific terms
- Leverage tag-based filtering
- Keep memory content focused and concise

### For MongoDB Atlas
- Enable vector search for semantic discovery
- Use hybrid search for best results
- Leverage aggregation pipelines for complex queries

## Troubleshooting

### Common Issues

1. **Memory not found**: Check project name and filename spelling
2. **Search returns no results**: Try broader terms or check tags
3. **Slow performance**: Ensure proper indexing and connection pooling

### Debug Commands

```
# Check connection
"List all projects" (should return without error)

# Verify storage
"Store a test memory and then load it back"

# Test search
"Search for a term you know exists"
```

## Best Practices

1. **Descriptive filenames**: Use clear, searchable names
2. **Consistent tagging**: Develop and stick to a tagging strategy
3. **Regular cleanup**: Archive or update outdated memories
4. **Project organization**: Group related memories by project
5. **Content quality**: Write clear, searchable content
6. **Backup strategy**: Regular MongoDB backups for important memories

## Integration Examples

### With Development Workflow

```
# During code review
"Store this code review feedback for future reference"

# When debugging
"Search for similar error patterns I've encountered"

# Architecture planning
"Find all memories about microservices design patterns"

# Learning new technology
"Store these React best practices I just learned"
```

### With Team Collaboration

```
# Share knowledge
"Store this team decision about API versioning strategy"

# Document solutions
"Remember this fix for the deployment pipeline issue"

# Track decisions
"Store the reasoning behind choosing PostgreSQL over MongoDB"
```

This MongoDB Memory Bank MCP Server transforms your development knowledge into a searchable, AI-accessible resource that grows with your experience and helps you build better software faster.
