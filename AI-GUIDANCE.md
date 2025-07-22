# 🤖 AI GUIDANCE: MongoDB Memory Bank MCP

## 🚨 CRITICAL RULES - NEVER VIOLATE THESE

### **1. PROJECT STRUCTURE IS SACRED**
- **EVERY project MUST have exactly 6 core files**
- **NO EXCEPTIONS** - if a project doesn't have all 6 files, it's BROKEN
- **The 6 core files are:**
  1. `projectbrief.md` (foundation)
  2. `productContext.md` (user/UX)
  3. `systemPatterns.md` (architecture)
  4. `techContext.md` (technology)
  5. `activeContext.md` (current work)
  6. `progress.md` (status/issues)

### **2. HYBRID SEARCH FIRST - ALWAYS**
- **EVERY memory operation MUST start with hybrid search**
- **Use `memory_search` with `useSemanticSearch: true` FIRST**
- **Then route content to appropriate core file**
- **Never create new files without searching first**

### **3. PROJECT CREATION & CONNECTION**
- **For NEW projects**: Use `create_project` tool
- **For EXISTING projects**: Use `connect_to_project` tool
- **NEVER use `memory_bank_write` without proper project setup**

---

## 📋 STEP-BY-STEP WORKFLOWS

### **WORKFLOW 1: Initial Setup (New Project)**

```
1. 🎯 CREATE PROJECT
   Tool: create_project
   Parameters: {
     "projectName": "my-project-name",
     "description": "Brief project description"
   }
   Result: Creates ALL 6 core files + vector embeddings

2. ✅ VERIFY CREATION
   Tool: list_project_files
   Expected: Exactly 6 files listed

3. 🔍 TEST HYBRID SEARCH
   Tool: memory_search
   Parameters: {
     "query": "project overview",
     "useSemanticSearch": true
   }
   Expected: Returns relevant core files
```

### **WORKFLOW 2: Connect to Existing Project**

```
1. 📋 LIST PROJECTS
   Tool: list_projects
   Result: Shows all available projects

2. 🔗 CONNECT TO PROJECT
   Tool: connect_to_project
   Parameters: {
     "projectName": "existing-project-name"
   }
   Result: Sets project context

3. ✅ VALIDATE STRUCTURE
   Tool: list_project_files
   Expected: Exactly 6 core files
   If not 6 files: PROJECT IS BROKEN - report error
```

### **WORKFLOW 3: Add/Update Memory (CRITICAL)**

```
1. 🔍 HYBRID SEARCH FIRST (MANDATORY)
   Tool: memory_search
   Parameters: {
     "query": "content keywords",
     "useSemanticSearch": true
   }
   Purpose: Find which core file to update

2. 🎯 INTELLIGENT ROUTING
   Tool: memory_bank_write
   Parameters: {
     "fileName": "descriptive-name.md",
     "content": "your content here"
   }
   System will: 
   - Use hybrid search automatically
   - Route to appropriate core file
   - Update existing content (not create new file)

3. ✅ VERIFY UPDATE
   Tool: list_project_files
   Expected: Still exactly 6 files (no new files created)
```

---

## 🚨 ERROR DETECTION & RECOVERY

### **ERROR 1: Project has wrong number of files**
```
Problem: list_project_files returns != 6 files
Solution: 
1. Report: "CRITICAL ERROR: Project structure broken"
2. Use: create_project to recreate proper structure
3. Migrate existing content to new structure
```

### **ERROR 2: Memory not routing to core files**
```
Problem: New files being created instead of updating core files
Solution:
1. Check: hybrid search is working (memory_search)
2. Verify: content routing logic
3. Use: memory_bank_write with explicit routing
```

### **ERROR 3: Hybrid search not working**
```
Problem: Vector search returning no results
Solution:
1. Check: VOYAGE_API_KEY is set
2. Verify: Vector embeddings exist
3. Regenerate: Use create_project to rebuild vectors
```

---

## 🎯 BEST PRACTICES

### **Memory Content Guidelines**
- **User requirements** → `productContext.md`
- **Technical specs** → `techContext.md`
- **Architecture decisions** → `systemPatterns.md`
- **Current work** → `activeContext.md`
- **Project goals** → `projectbrief.md`
- **Status updates** → `progress.md`

### **Hybrid Search Optimization**
- Use specific keywords in search queries
- Search before every memory operation
- Leverage semantic similarity for routing
- Always check search results before routing

### **Project Management**
- One project per working directory
- Clear, descriptive project names
- Regular validation of 6-file structure
- Consistent use of project context

---

## 🔧 TROUBLESHOOTING

### **Common Issues:**
1. **"Project not found"** → Use `create_project` first
2. **"Wrong file count"** → Project structure corrupted
3. **"No search results"** → Vector embeddings missing
4. **"Content not routing"** → Hybrid search disabled

### **Recovery Steps:**
1. Always start with `list_projects`
2. Validate structure with `list_project_files`
3. Test search with `memory_search`
4. Recreate if necessary with `create_project`

---

## ✅ SUCCESS METRICS

### **Healthy Project Indicators:**
- ✅ Exactly 6 core files
- ✅ Hybrid search returns results
- ✅ Content routes to core files
- ✅ No duplicate/orphan files
- ✅ Vector embeddings present

### **System Working Correctly:**
- ✅ New content updates existing core files
- ✅ Search finds relevant memories
- ✅ Project isolation maintained
- ✅ All operations use hybrid search first

**Remember: The system is designed to be intelligent. Trust the hybrid search and routing - don't fight it!**
