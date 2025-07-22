# MongoDB Memory Bank MCP - Custom Instructions

**CRITICAL: These instructions MUST be followed to prevent content accumulation and maintain clean 6-file structure.**

## 🎯 MANDATORY WORKFLOW - NEVER SKIP

### **Pre-Flight Validation (ALWAYS FIRST)**
```
1. memory_search(query="relevant topic", useSemanticSearch=true)
2. list_project_files()
3. memory_bank_read(fileName="relevant-core-file.md")
4. memory_bank_update(fileName="same-file.md", content="MERGED content")
```

### **6-File Core Structure (ENFORCE STRICTLY)**
```
projectbrief.md     → Project overview, goals, requirements
productContext.md   → Market analysis, competitive landscape  
systemPatterns.md   → Architecture, design patterns, implementation
techContext.md      → Technology stack, configuration, setup
activeContext.md    → Current work, priorities, decisions
progress.md         → Status tracking, milestones, roadmap
```

## 🚫 FORBIDDEN ACTIONS
- ❌ Creating files with analysis names (e.g., "analysis.md", "research.md")
- ❌ Using memory_bank_write for existing projects (use memory_bank_update)
- ❌ Appending content with section headers to existing files
- ❌ Creating more than 6 core files per project
- ❌ Ignoring hybrid search results

## ✅ REQUIRED ACTIONS
- ✅ Always use memory_search FIRST with useSemanticSearch=true
- ✅ Always read existing content before updating
- ✅ Always merge new content with existing content
- ✅ Always route content to appropriate core files
- ✅ Always maintain clean 6-file structure

## 🎯 CONTENT ROUTING RULES

### **Technical Content** → `techContext.md`
- MongoDB configuration, database setup
- API keys, environment variables
- Performance metrics, benchmarks
- Technology stack details

### **Architecture Content** → `systemPatterns.md`
- Design patterns, code structure
- MCP implementation details
- Security patterns, validation
- Component relationships

### **Product/Market Content** → `productContext.md`
- Competitive analysis, market positioning
- User requirements, business context
- Value propositions, use cases
- Market research, customer feedback

### **Project Management** → `projectbrief.md`
- Project goals, objectives, mission
- Success criteria, deliverables
- Core requirements, constraints
- Project overview, scope

### **Current Work** → `activeContext.md`
- Current priorities, immediate tasks
- Development focus, decisions
- Active investigations, research
- Work in progress, next steps

### **Status Tracking** → `progress.md`
- Milestones, timeline, roadmap
- Completed tasks, achievements
- Issues, blockers, challenges
- Future plans, enhancements

## 🔄 CONTENT MERGING STRATEGY

### **Before Updating ANY File:**
1. **Search for existing content**: `memory_search(query="topic keywords")`
2. **Read target file**: `memory_bank_read(fileName="target-file.md")`
3. **Merge intelligently**: Combine new content with existing content
4. **Update with merged content**: `memory_bank_update(fileName="target-file.md", content="merged")`

### **Merging Guidelines:**
- **Append new sections** to existing structure
- **Update existing sections** with new information
- **Avoid duplication** - merge similar content
- **Maintain markdown structure** with proper headers
- **Preserve existing valuable content**

## 🚀 MongoDB $rankFusion Advantage

### **Always Use Hybrid Search:**
```typescript
memory_search({
  query: "relevant keywords",
  useSemanticSearch: true,  // ALWAYS true for best results
  limit: 5
})
```

### **Leverage Search Results:**
- Use search results to find existing related content
- Identify which core file should be updated
- Understand current project context
- Avoid creating duplicate content

## 🎯 EXAMPLE WORKFLOW

### **Adding Technical Analysis:**
```
1. memory_search(query="mongodb technical implementation", useSemanticSearch=true)
2. list_project_files()
3. memory_bank_read(fileName="techContext.md")
4. // Merge new analysis with existing technical content
5. memory_bank_update(fileName="techContext.md", content="MERGED technical content")
```

### **Adding Competitive Analysis:**
```
1. memory_search(query="competitive analysis market", useSemanticSearch=true)
2. memory_bank_read(fileName="productContext.md")
3. // Merge new competitive insights with existing product context
4. memory_bank_update(fileName="productContext.md", content="MERGED product content")
```

## 🔧 TOOL USAGE PATTERNS

### **Primary Tool: memory_bank_update**
- Use for ALL content updates in existing projects
- Always merge new content with existing content
- Route content to appropriate core files
- Maintain clean 6-file structure

### **Search Tool: memory_search**
- Use BEFORE every update operation
- Set useSemanticSearch=true for best results
- Use results to guide content routing decisions
- Leverage MongoDB's $rankFusion hybrid search

### **Rarely Used: memory_bank_write**
- Only for initial project setup
- Only for creating the 6 core files
- Never use for existing projects
- Always check if file exists first

## 🎯 SUCCESS METRICS

### **Structure Quality:**
- Exactly 6 core files maintained
- No content accumulation in any file
- Clean, focused content in each file
- Proper content routing and organization

### **Search Performance:**
- Hybrid search used for every operation
- Relevant content found efficiently
- No context window flooding
- Optimal AI consumption format

### **Content Quality:**
- No duplication across files
- Intelligent content merging
- Proper markdown structure
- Comprehensive project coverage

## 🚨 EMERGENCY FIXES

### **If Content Accumulation Detected:**
1. Use memory_search to find accumulated content
2. Read all 6 core files to understand current state
3. Redistribute content to appropriate core files
4. Update each core file with properly organized content
5. Verify clean 6-file structure maintained

### **If Wrong File Updated:**
1. Use memory_search to find the content
2. Read both source and target files
3. Move content to correct core file
4. Clean up source file if necessary
5. Verify proper content routing

---

**REMEMBER: The MongoDB Memory Bank MCP's power comes from MongoDB's revolutionary $rankFusion hybrid search. Always leverage this capability to maintain perfect content organization and provide optimal context for AI code generation.**
