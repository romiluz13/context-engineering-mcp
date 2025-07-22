import { Memory } from "../../../domain/entities/index.js";
import { MemoryStoreParams, MemoryStoreUseCase } from "../../../domain/usecases/memory-store.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";
import { ProjectRepository } from "../../protocols/project-repository.js";
import { MemoryType } from "../../../domain/entities/memory.js";
import { ClineMemoryStructure, CLINE_CORE_FILES } from "../../../shared/services/cline-memory-structure.js";
import { validateProjectContext } from "../../../shared/services/project-context-manager.js";

export class MemoryStore implements MemoryStoreUseCase {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async store(params: MemoryStoreParams): Promise<Memory> {
    const { projectName, fileName, content, tags = [] } = params;

    console.log(`[MEMORY-STORE] 🔍 HYBRID SEARCH FIRST: Starting with search for project: ${projectName}`);

    // 🔒 PROJECT VALIDATION: Ensure we're working on the correct project
    const isValidProject = await validateProjectContext(projectName);
    if (!isValidProject) {
      throw new Error(`Project context validation failed for: ${projectName}`);
    }

    // Ensure project exists
    await this.projectRepository.ensureProject(projectName);

    // 🚨 WRITE-ONLY VALIDATION: Fail if file already exists (following their pattern)
    const existingMemory = await this.memoryRepository.findByFileName(projectName, fileName);
    if (existingMemory) {
      // For ALL files, fail if exists (use update instead) - this is WRITE-ONLY behavior
      throw new Error(`File ${fileName} already exists in project ${projectName}. Use memory_bank_update to modify existing files.`);
    }

    // 🔍 STEP 1: HYBRID SEARCH FIRST - Find ALL related memories
    console.log(`[MEMORY-STORE] 🔍 Hybrid search for existing memories related to: ${fileName}`);
    const searchResults = await this.memoryRepository.search({
      query: `${fileName} ${content.substring(0, 200)}`,
      projectName,
      limit: 10,
      useSemanticSearch: true
    });

    console.log(`[MEMORY-STORE] 🔍 Found ${searchResults.length} related memories via hybrid search`);

    // 🎯 CONTENT DISTRIBUTION BREAKTHROUGH: ALWAYS route to core files - never create separate files
    const routingAnalysis = ClineMemoryStructure.analyzeContentRouting(fileName, content);

    // 🚀 FORCED DISTRIBUTION: Check if we should route to a different core file or enhance existing core file
    if (Object.values(CLINE_CORE_FILES).includes(fileName as any)) {
      // Direct core file write - enhance existing content
      console.log(`[CLINE-ROUTING] Direct core file write: ${fileName}`);
      return this.updateCoreFile(projectName, fileName, content, fileName, routingAnalysis.mergeStrategy, tags);
    } else {
      // 🎯 BREAKTHROUGH: ALWAYS route to core files - never create separate files
      console.log(`[CONTENT-DISTRIBUTION] 🚀 Routing ${fileName} → ${routingAnalysis.coreFile} (${routingAnalysis.reasoning})`);
      console.log(`[CONTENT-DISTRIBUTION] 💡 Breakthrough: All content distributed to 6 core files for optimal AI context`);
      return this.updateCoreFile(projectName, routingAnalysis.coreFile, content, fileName, routingAnalysis.mergeStrategy, tags);
    }

    // 🔍 SEARCH-FIRST LOGIC: For core files, we already checked above, so this is for edge cases
    if (existingMemory && Object.values(CLINE_CORE_FILES).includes(fileName as any)) {
      console.log(`[SEARCH-FIRST] Found existing core file: ${fileName}, using intelligent merge`);
      return this.intelligentMemoryMerge(existingMemory!, content, tags);
    }

    // 🔍 HYBRID SEARCH: Find similar memories to potentially consolidate
    const similarMemories = await this.findSimilarMemoriesForConsolidation(projectName, fileName, content);

    if (similarMemories.length > 0) {
      console.log(`[SEARCH-FIRST] Found ${similarMemories.length} similar memories, checking for consolidation opportunities`);
      const consolidationResult = await this.considerMemoryConsolidation(similarMemories, fileName, content, tags);
      if (consolidationResult) {
        return consolidationResult!;
      }
    }

    // 🧠 ENHANCED: COMPREHENSIVE AI CONTEXT ANALYSIS
    const analysis = this.analyzeContentForAI(fileName, content);

    // 🎯 INTELLIGENT TAG GENERATION: Optimized for AI code generation
    const enhancedTags = this.generateAIOptimizedTags(content, fileName, analysis);
    const finalTags = tags.length > 0 ? [...tags, ...enhancedTags] : enhancedTags;

    // 🔍 RELATED MEMORY DISCOVERY: Find contextually relevant memories
    const relatedMemories = await this.findRelatedMemoriesForAI(projectName, content, analysis);

    const memory: Memory = {
      projectName,
      fileName,
      content,
      tags: finalTags,
      lastModified: new Date(),
      wordCount: this.countWords(content),
      // 🚀 ENHANCED: AI-optimized metadata
      memoryType: analysis.contentType as MemoryType,
      summary: this.generateAISummary(content, analysis),
      // Store AI context analysis for enhanced search
      metadata: {
        aiContextType: analysis.aiContextType,
        codeRelevance: analysis.codeRelevance,
        technicalDepth: analysis.technicalDepth,
        implementationDetails: analysis.implementationDetails,
        errorPatterns: analysis.errorPatterns,
        architecturalInsights: analysis.architecturalInsights,
        relatedMemories: relatedMemories.map(m => m.fileName)
      }
    };

    console.log(`[SEARCH-FIRST] Creating new memory: ${fileName}`);
    const storedMemory = await this.memoryRepository.store(memory);

    // 🤖 AI GUIDANCE: Check if all core files have real content
    await this.provideAIGuidanceForCompleteness(projectName, storedMemory);

    return storedMemory;
  }

  // 🧠 ENHANCED: INTELLIGENT CONTENT ANALYSIS FOR OPTIMAL AI CONTEXT
  private analyzeContentForAI(fileName: string, content: string): {
    contentType: string;
    aiContextType: string;
    codeRelevance: number;
    technicalDepth: number;
    implementationDetails: string[];
    errorPatterns: string[];
    architecturalInsights: string[];
  } {
    const lowerFileName = fileName.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Analyze content for AI code generation needs
    const analysis = {
      contentType: this.detectContentType(lowerFileName, lowerContent),
      aiContextType: this.detectAIContextType(content),
      codeRelevance: this.calculateCodeRelevance(content),
      technicalDepth: this.calculateTechnicalDepth(content),
      implementationDetails: this.extractImplementationDetails(content),
      errorPatterns: this.extractErrorPatterns(content),
      architecturalInsights: this.extractArchitecturalInsights(content)
    };

    return analysis;
  }

  private detectContentType(fileName: string, content: string): string {
    // Architecture & System Design
    if (content.includes('architecture') || content.includes('system design') ||
        content.includes('component') || content.includes('module') ||
        fileName.includes('architecture') || fileName.includes('system')) {
      return 'architecture';
    }

    // Implementation & Code Patterns
    if (content.includes('implementation') || content.includes('function') ||
        content.includes('class') || content.includes('method') ||
        content.includes('algorithm') || content.includes('pattern')) {
      return 'implementation';
    }

    // Error Solutions & Debugging
    if (content.includes('error') || content.includes('bug') ||
        content.includes('issue') || content.includes('fix') ||
        content.includes('debug') || content.includes('solution')) {
      return 'error-solution';
    }

    // Performance & Optimization
    if (content.includes('performance') || content.includes('optimization') ||
        content.includes('speed') || content.includes('memory') ||
        content.includes('benchmark') || content.includes('profiling')) {
      return 'performance';
    }

    // Configuration & Setup
    if (content.includes('config') || content.includes('setup') ||
        content.includes('installation') || content.includes('deployment') ||
        fileName.includes('config') || fileName.includes('setup')) {
      return 'configuration';
    }

    // Testing & Quality
    if (content.includes('test') || content.includes('testing') ||
        content.includes('quality') || content.includes('validation') ||
        fileName.includes('test')) {
      return 'testing';
    }

    // API & Integration
    if (content.includes('api') || content.includes('endpoint') ||
        content.includes('integration') || content.includes('service') ||
        content.includes('request') || content.includes('response')) {
      return 'api-integration';
    }

    // Database & Data
    if (content.includes('database') || content.includes('query') ||
        content.includes('schema') || content.includes('migration') ||
        content.includes('data model') || content.includes('sql')) {
      return 'database';
    }

    // Security & Authentication
    if (content.includes('security') || content.includes('auth') ||
        content.includes('permission') || content.includes('encryption') ||
        content.includes('token') || content.includes('credential')) {
      return 'security';
    }

    // Progress & Planning
    if (content.includes('progress') || content.includes('milestone') ||
        content.includes('completed') || content.includes('todo') ||
        fileName.includes('progress') || fileName.includes('plan')) {
      return 'progress';
    }

    return 'general';
  }

  // 🎯 AI CONTEXT ANALYSIS: What type of context does AI need from this content?
  private detectAIContextType(content: string): string {
    const lowerContent = content.toLowerCase();

    // Code Generation Context
    if (lowerContent.includes('function') || lowerContent.includes('class') ||
        lowerContent.includes('method') || lowerContent.includes('algorithm') ||
        lowerContent.includes('implementation') || lowerContent.includes('code example')) {
      return 'code-generation';
    }

    // Architectural Decision Context
    if (lowerContent.includes('decision') || lowerContent.includes('choice') ||
        lowerContent.includes('alternative') || lowerContent.includes('trade-off') ||
        lowerContent.includes('why we chose') || lowerContent.includes('rationale')) {
      return 'architectural-decision';
    }

    // Problem-Solution Context
    if (lowerContent.includes('problem') || lowerContent.includes('challenge') ||
        lowerContent.includes('solution') || lowerContent.includes('approach') ||
        lowerContent.includes('resolved') || lowerContent.includes('fixed')) {
      return 'problem-solution';
    }

    // Pattern & Best Practice Context
    if (lowerContent.includes('pattern') || lowerContent.includes('best practice') ||
        lowerContent.includes('convention') || lowerContent.includes('standard') ||
        lowerContent.includes('guideline') || lowerContent.includes('principle')) {
      return 'pattern-practice';
    }

    // Learning & Insight Context
    if (lowerContent.includes('learned') || lowerContent.includes('insight') ||
        lowerContent.includes('discovery') || lowerContent.includes('gotcha') ||
        lowerContent.includes('important') || lowerContent.includes('key finding')) {
      return 'learning-insight';
    }

    return 'general-context';
  }

  // 📊 CODE RELEVANCE: How relevant is this content for code generation?
  private calculateCodeRelevance(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();

    // High relevance indicators
    const highRelevanceTerms = [
      'function', 'class', 'method', 'algorithm', 'implementation', 'code',
      'api', 'endpoint', 'database', 'query', 'schema', 'model',
      'component', 'module', 'service', 'library', 'framework'
    ];

    // Medium relevance indicators
    const mediumRelevanceTerms = [
      'architecture', 'design', 'pattern', 'structure', 'organization',
      'configuration', 'setup', 'deployment', 'environment',
      'testing', 'validation', 'error handling', 'security'
    ];

    // Low relevance indicators
    const lowRelevanceTerms = [
      'meeting', 'discussion', 'planning', 'timeline', 'milestone',
      'progress', 'status', 'update', 'review'
    ];

    // Calculate score based on term frequency
    highRelevanceTerms.forEach(term => {
      const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += matches * 3;
    });

    mediumRelevanceTerms.forEach(term => {
      const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
    });

    lowRelevanceTerms.forEach(term => {
      const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += matches * 0.5;
    });

    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, score * 2));
  }

  // 🔬 TECHNICAL DEPTH: How technically detailed is this content?
  private calculateTechnicalDepth(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();

    // Technical depth indicators
    const technicalTerms = [
      'typescript', 'javascript', 'python', 'rust', 'go', 'java',
      'react', 'node', 'express', 'mongodb', 'postgresql', 'redis',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp',
      'jwt', 'oauth', 'graphql', 'rest', 'websocket',
      'async', 'await', 'promise', 'callback', 'event',
      'middleware', 'decorator', 'interface', 'generic',
      'optimization', 'performance', 'memory', 'cpu',
      'index', 'query', 'transaction', 'migration'
    ];

    // Code-specific indicators
    const codeIndicators = [
      'function(', 'class ', 'interface ', 'type ', 'const ',
      'async ', 'await ', 'return ', 'throw ', 'try {', 'catch',
      'import ', 'export ', 'require(', 'module.exports',
      '=> {', '() => ', 'new ', 'this.', '.then(', '.catch('
    ];

    // Calculate technical term frequency
    technicalTerms.forEach(term => {
      const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
    });

    // Calculate code indicator frequency
    codeIndicators.forEach(indicator => {
      const matches = (content.match(new RegExp(indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += matches * 3;
    });

    // Bonus for code blocks
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
    score += codeBlocks * 10;

    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, score));
  }

  // 🔧 IMPLEMENTATION DETAILS: Extract specific implementation patterns for AI
  private extractImplementationDetails(content: string): string[] {
    const details: string[] = [];
    const lines = content.split('\n');

    // Extract code patterns
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = content.match(codeBlockRegex) || [];
    codeBlocks.forEach(block => {
      // Extract key patterns from code blocks
      if (block.includes('function') || block.includes('const') || block.includes('class')) {
        details.push(`Code pattern: ${block.substring(0, 100)}...`);
      }
    });

    // Extract configuration patterns
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('config') || trimmed.includes('setting') || trimmed.includes('option')) {
        details.push(`Configuration: ${trimmed}`);
      }
    });

    // Extract API patterns
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('endpoint') || trimmed.includes('route') || trimmed.includes('api')) {
        details.push(`API pattern: ${trimmed}`);
      }
    });

    // Extract database patterns
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('query') || trimmed.includes('schema') || trimmed.includes('model')) {
        details.push(`Database pattern: ${trimmed}`);
      }
    });

    return details.slice(0, 10); // Limit to most relevant
  }

  // 🚨 ERROR PATTERNS: Extract error patterns and solutions for AI learning
  private extractErrorPatterns(content: string): string[] {
    const patterns: string[] = [];
    const lines = content.split('\n');

    // Extract error descriptions
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('error:') || trimmed.includes('failed:') || trimmed.includes('issue:')) {
        patterns.push(`Error: ${line.trim()}`);
      }
    });

    // Extract solution patterns
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('solution:') || trimmed.includes('fix:') || trimmed.includes('resolved:')) {
        patterns.push(`Solution: ${line.trim()}`);
      }
    });

    // Extract debugging insights
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('debug') || trimmed.includes('trace') || trimmed.includes('root cause')) {
        patterns.push(`Debug insight: ${line.trim()}`);
      }
    });

    return patterns.slice(0, 8); // Limit to most relevant
  }

  // 🏗️ ARCHITECTURAL INSIGHTS: Extract architectural decisions and rationale
  private extractArchitecturalInsights(content: string): string[] {
    const insights: string[] = [];
    const lines = content.split('\n');

    // Extract decision rationale
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('decided') || trimmed.includes('chose') || trimmed.includes('because')) {
        insights.push(`Decision: ${line.trim()}`);
      }
    });

    // Extract trade-offs
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('trade-off') || trimmed.includes('pros and cons') || trimmed.includes('alternative')) {
        insights.push(`Trade-off: ${line.trim()}`);
      }
    });

    // Extract performance considerations
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('performance') || trimmed.includes('scalability') || trimmed.includes('optimization')) {
        insights.push(`Performance: ${line.trim()}`);
      }
    });

    // Extract security considerations
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('security') || trimmed.includes('vulnerability') || trimmed.includes('auth')) {
        insights.push(`Security: ${line.trim()}`);
      }
    });

    return insights.slice(0, 8); // Limit to most relevant
  }

  // 🎯 AI-OPTIMIZED TAG GENERATION: Tags that help AI understand context better
  private generateAIOptimizedTags(content: string, fileName: string, analysis: any): string[] {
    const tags: string[] = [];

    // Add content type tags
    tags.push(analysis.contentType);
    tags.push(analysis.aiContextType);

    // Add technical depth indicator
    if (analysis.technicalDepth > 70) {
      tags.push('high-technical-depth');
    } else if (analysis.technicalDepth > 40) {
      tags.push('medium-technical-depth');
    }

    // Add code relevance indicator
    if (analysis.codeRelevance > 70) {
      tags.push('high-code-relevance');
    } else if (analysis.codeRelevance > 40) {
      tags.push('medium-code-relevance');
    }

    // Extract technology tags
    const techTags = this.extractTechnologyTags(content);
    tags.push(...techTags);

    // Extract pattern tags
    const patternTags = this.extractPatternTags(content);
    tags.push(...patternTags);

    // Add file-based tags
    const fileBaseName = fileName.replace(/\.[^/.]+$/, "");
    const fileWords = fileBaseName.split(/[-_\s]+/).filter(word => word.length > 2);
    tags.push(...fileWords);

    // Remove duplicates and limit
    return [...new Set(tags)].slice(0, 15);
  }

  // 🔧 TECHNOLOGY TAG EXTRACTION: Identify specific technologies for better AI context
  private extractTechnologyTags(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const techTags: string[] = [];

    // Programming languages
    const languages = ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c++', 'c#'];
    languages.forEach(lang => {
      if (lowerContent.includes(lang)) techTags.push(lang);
    });

    // Frameworks and libraries
    const frameworks = ['react', 'vue', 'angular', 'express', 'fastapi', 'django', 'spring', 'nest'];
    frameworks.forEach(fw => {
      if (lowerContent.includes(fw)) techTags.push(fw);
    });

    // Databases
    const databases = ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'sqlite'];
    databases.forEach(db => {
      if (lowerContent.includes(db)) techTags.push(db);
    });

    // Cloud and infrastructure
    const infrastructure = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'];
    infrastructure.forEach(infra => {
      if (lowerContent.includes(infra)) techTags.push(infra);
    });

    return techTags;
  }

  // 🎨 PATTERN TAG EXTRACTION: Identify design patterns and practices
  private extractPatternTags(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const patternTags: string[] = [];

    // Design patterns
    const patterns = ['singleton', 'factory', 'observer', 'strategy', 'decorator', 'adapter', 'facade'];
    patterns.forEach(pattern => {
      if (lowerContent.includes(pattern)) patternTags.push(`pattern-${pattern}`);
    });

    // Architectural patterns
    const archPatterns = ['microservices', 'monolith', 'mvc', 'mvp', 'mvvm', 'clean-architecture'];
    archPatterns.forEach(pattern => {
      if (lowerContent.includes(pattern)) patternTags.push(`arch-${pattern}`);
    });

    // Development practices
    const practices = ['tdd', 'bdd', 'ddd', 'solid', 'dry', 'kiss', 'yagni'];
    practices.forEach(practice => {
      if (lowerContent.includes(practice)) patternTags.push(`practice-${practice}`);
    });

    return patternTags;
  }

  // 🔍 RELATED MEMORY DISCOVERY: Find memories that provide relevant context for AI
  private async findRelatedMemoriesForAI(projectName: string, content: string, analysis: any): Promise<Memory[]> {
    try {
      // Find memories with similar content type
      const similarTypeMemories = await this.memoryRepository.searchByType(
        analysis.contentType as MemoryType,
        projectName,
        5
      );

      // Find memories with overlapping technologies
      const techTags = this.extractTechnologyTags(content);
      const techRelatedMemories = await this.memoryRepository.searchByTags(
        techTags,
        projectName,
        3
      );

      // Combine and deduplicate
      const allRelated = [...similarTypeMemories, ...techRelatedMemories];
      const uniqueRelated = allRelated.filter((memory, index, self) =>
        index === self.findIndex(m => m.fileName === memory.fileName)
      );

      return uniqueRelated.slice(0, 5);
    } catch (error) {
      // Graceful fallback if advanced search fails
      return [];
    }
  }

  // 📝 AI SUMMARY GENERATION: Create concise summary optimized for AI context
  private generateAISummary(content: string, analysis: any): string {
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    // Extract key sentences based on AI context needs
    const keySentences: string[] = [];

    // Add first meaningful line as context
    const firstMeaningful = lines.find(line =>
      line.trim().length > 20 &&
      !line.startsWith('#') &&
      !line.startsWith('*') &&
      !line.startsWith('-')
    );
    if (firstMeaningful) {
      keySentences.push(firstMeaningful.trim());
    }

    // Add implementation details
    if (analysis.implementationDetails.length > 0) {
      keySentences.push(`Implementation: ${analysis.implementationDetails[0]}`);
    }

    // Add error patterns if present
    if (analysis.errorPatterns.length > 0) {
      keySentences.push(`Error pattern: ${analysis.errorPatterns[0]}`);
    }

    // Add architectural insights if present
    if (analysis.architecturalInsights.length > 0) {
      keySentences.push(`Architecture: ${analysis.architecturalInsights[0]}`);
    }

    // Create summary
    const summary = keySentences.join(' | ').substring(0, 300);
    return summary || content.substring(0, 200);
  }

  // 🔧 UTILITY: Count words in content
  private countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // 🎯 CLINE CORE FILE UPDATE: Update core files using Cline's structure
  private async updateCoreFile(
    projectName: string,
    coreFileName: string,
    content: string,
    originalFileName: string,
    mergeStrategy: 'replace' | 'append' | 'merge' | 'section-update',
    tags: string[] = []
  ): Promise<Memory> {
    console.log(`[CLINE-UPDATE] Updating core file: ${coreFileName} with content from ${originalFileName}`);

    // 🚨 CONTENT LENGTH VALIDATION: Prevent context window overflow
    const wordCount = this.countWords(content);
    if (wordCount > 2000) {
      console.warn(`[CLINE-UPDATE] ⚠️ Large content detected (${wordCount} words) for ${coreFileName}`);
      console.warn(`[CLINE-UPDATE] Consider breaking into smaller, focused sections`);
    }

    // Check if core file exists
    let existingCoreFile = await this.memoryRepository.findByFileName(projectName, coreFileName);

    if (!existingCoreFile) {
      // Create core file with template
      const template = ClineMemoryStructure.getCoreFileTemplate(coreFileName, projectName);
      existingCoreFile = await this.memoryRepository.store({
        projectName,
        fileName: coreFileName,
        content: template,
        tags: ['core', 'cline-structure'],
        lastModified: new Date(),
        wordCount: this.countWords(template),
        memoryType: 'documentation' as MemoryType
      });
      console.log(`[CLINE-UPDATE] Created new core file: ${coreFileName}`);
    }

    // Merge content based on strategy
    let updatedContent: string;
    switch (mergeStrategy) {
      case 'replace':
        updatedContent = content;
        break;
      case 'append':
        updatedContent = `${existingCoreFile.content}\n\n## ${originalFileName}\n${content}`;
        break;
      case 'section-update':
        updatedContent = this.updateCoreFileSection(existingCoreFile.content, content, originalFileName);
        break;
      case 'merge':
      default:
        updatedContent = this.mergeComplementaryContent(existingCoreFile.content, content);
        break;
    }

    // Update core file
    const updatedMemory: Memory = {
      ...existingCoreFile,
      content: updatedContent,
      tags: this.mergeTags(existingCoreFile.tags, [...tags, 'updated-from:' + originalFileName]),
      lastModified: new Date(),
      wordCount: this.countWords(updatedContent)
    };

    return await this.memoryRepository.store(updatedMemory);
  }

  // 🔄 INTELLIGENT MEMORY MERGE: Merge new content with existing memory
  private async intelligentMemoryMerge(existingMemory: Memory, newContent: string, newTags: string[] = []): Promise<Memory> {
    console.log(`[MEMORY-MERGE] Merging content for: ${existingMemory.fileName}`);

    // Analyze both contents
    const existingAnalysis = this.analyzeContentForAI(existingMemory.fileName, existingMemory.content);
    const newAnalysis = this.analyzeContentForAI(existingMemory.fileName, newContent);

    // Intelligent content merging strategy
    let mergedContent: string;

    if (this.shouldReplaceContent(existingMemory.content, newContent, existingAnalysis, newAnalysis)) {
      // Replace if new content is significantly better
      mergedContent = newContent;
      console.log(`[MEMORY-MERGE] Replacing content (new content is better)`);
    } else if (this.shouldAppendContent(existingMemory.content, newContent)) {
      // Append if content is complementary
      mergedContent = this.mergeComplementaryContent(existingMemory.content, newContent);
      console.log(`[MEMORY-MERGE] Appending complementary content`);
    } else {
      // Update with enhanced content
      mergedContent = this.enhanceExistingContent(existingMemory.content, newContent);
      console.log(`[MEMORY-MERGE] Enhancing existing content`);
    }

    // Merge tags intelligently
    const mergedTags = this.mergeTags(existingMemory.tags, newTags);

    // Update the memory
    const updatedMemory: Memory = {
      ...existingMemory,
      content: mergedContent,
      tags: mergedTags,
      lastModified: new Date(),
      wordCount: this.countWords(mergedContent),
      summary: this.generateAISummary(mergedContent, newAnalysis)
    };

    return await this.memoryRepository.store(updatedMemory);
  }

  // 🔍 FIND SIMILAR MEMORIES: Use hybrid search to find memories for potential consolidation
  private async findSimilarMemoriesForConsolidation(projectName: string, fileName: string, content: string): Promise<Memory[]> {
    try {
      // Use hybrid search to find similar content
      const searchResults = await this.memoryRepository.search({
        query: content.substring(0, 200), // Use first 200 chars as search query
        projectName,
        limit: 5,
        useSemanticSearch: true
      });

      // Filter out exact filename matches and low-relevance results
      return searchResults
        .filter(result => result.fileName !== fileName && (result.score || 0) > 0.7)
        .map(result => ({
          id: result.id,
          projectName: result.projectName,
          fileName: result.fileName,
          content: result.content,
          tags: result.tags,
          lastModified: result.lastModified,
          wordCount: result.wordCount,
          contentVector: result.contentVector,
          summary: result.summary,
          memoryType: result.memoryType,
          metadata: result.metadata
        }));
    } catch (error) {
      console.warn(`[SEARCH-FIRST] Error finding similar memories: ${error}`);
      return [];
    }
  }

  // 🤔 CONSIDER CONSOLIDATION: Decide whether to consolidate similar memories
  private async considerMemoryConsolidation(similarMemories: Memory[], fileName: string, content: string, tags: string[]): Promise<Memory | null> {
    // Only consolidate if we find very similar memories with related filenames
    const consolidationCandidates = similarMemories.filter(memory =>
      this.areMemoriesConsolidatable(memory, fileName, content)
    );

    if (consolidationCandidates.length === 0) {
      return null;
    }

    console.log(`[MEMORY-CONSOLIDATION] Found ${consolidationCandidates.length} consolidation candidates`);

    // For now, just merge with the most similar one
    const bestCandidate = consolidationCandidates[0];
    return this.intelligentMemoryMerge(bestCandidate, content, tags);
  }

  // 🧠 CONTENT ANALYSIS: Determine if content should be replaced
  private shouldReplaceContent(existingContent: string, newContent: string, existingAnalysis: any, newAnalysis: any): boolean {
    // Replace if new content is significantly longer and more detailed
    if (newContent.length > existingContent.length * 1.5 && newAnalysis.technicalDepth > existingAnalysis.technicalDepth) {
      return true;
    }

    // Replace if new content has more implementation details
    if (newAnalysis.implementationDetails.length > existingAnalysis.implementationDetails.length * 1.5) {
      return true;
    }

    // Replace if new content has higher code relevance
    if (newAnalysis.codeRelevance > existingAnalysis.codeRelevance + 0.3) {
      return true;
    }

    return false;
  }

  // 📝 CONTENT MERGING: Check if content should be appended
  private shouldAppendContent(existingContent: string, newContent: string): boolean {
    // Append if content is different and complementary
    const similarity = this.calculateContentSimilarity(existingContent, newContent);
    return similarity < 0.7 && similarity > 0.3; // Somewhat related but different
  }

  // 🔗 MERGE COMPLEMENTARY CONTENT: Intelligently combine different but related content
  private mergeComplementaryContent(existingContent: string, newContent: string): string {
    // Add a separator and append new content
    const separator = '\n\n---\n\n';
    return `${existingContent}${separator}${newContent}`;
  }

  // ✨ ENHANCE EXISTING CONTENT: Update existing content with new insights
  private enhanceExistingContent(existingContent: string, newContent: string): string {
    // For now, prefer the longer, more detailed content
    return newContent.length > existingContent.length ? newContent : existingContent;
  }

  // 🏷️ MERGE TAGS: Intelligently combine tag sets
  private mergeTags(existingTags: string[], newTags: string[]): string[] {
    const mergedTags = [...new Set([...existingTags, ...newTags])];
    return mergedTags.slice(0, 20); // Limit to 20 tags to avoid bloat
  }

  // 🔍 CONSOLIDATION CHECK: Determine if memories can be consolidated
  private areMemoriesConsolidatable(memory: Memory, fileName: string, content: string): boolean {
    // Check if filenames are related (similar patterns)
    const filenameSimilarity = this.calculateFilenameSimilarity(memory.fileName, fileName);
    if (filenameSimilarity < 0.5) {
      return false;
    }

    // Check if content is similar enough to consolidate
    const contentSimilarity = this.calculateContentSimilarity(memory.content, content);
    return contentSimilarity > 0.8; // High similarity threshold for consolidation
  }

  // 📊 FILENAME SIMILARITY: Calculate similarity between filenames
  private calculateFilenameSimilarity(filename1: string, filename2: string): number {
    // Simple similarity based on common words and patterns
    const words1 = filename1.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    const words2 = filename2.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // 📊 CONTENT SIMILARITY: Calculate similarity between content strings
  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple word-based similarity
    const words1 = content1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const words2 = content2.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  // 📝 CORE FILE SECTION UPDATE: Intelligently update sections in core files
  private updateCoreFileSection(existingContent: string, newContent: string, sourceFileName: string): string {
    // Look for existing section with same source
    const sectionPattern = new RegExp(`## ${sourceFileName}[\\s\\S]*?(?=##|$)`, 'g');

    if (sectionPattern.test(existingContent)) {
      // Update existing section
      return existingContent.replace(sectionPattern, `## ${sourceFileName}\n${newContent}\n`);
    } else {
      // Add new section
      return `${existingContent}\n\n## ${sourceFileName}\n${newContent}`;
    }
  }

  // 🤖 AI GUIDANCE: Provide intelligent feedback to ensure all core files get content
  private async provideAIGuidanceForCompleteness(projectName: string, storedMemory: Memory): Promise<void> {
    try {
      const { ClineMemoryStructure, CLINE_CORE_FILES } = await import('../../../shared/services/cline-memory-structure.js');
      const coreFiles = Object.values(CLINE_CORE_FILES);

      // Check which core files still have only template content
      const templateFiles: string[] = [];
      const contentFiles: string[] = [];
      const fileWordCounts: { [key: string]: number } = {};

      for (const coreFile of coreFiles) {
        const memory = await this.memoryRepository.findByFileName(projectName, coreFile);
        if (memory) {
          const isTemplate = this.isTemplateContent(memory.content);
          const wordCount = this.countWords(memory.content);
          fileWordCounts[coreFile] = wordCount;

          if (isTemplate) {
            templateFiles.push(coreFile);
          } else {
            contentFiles.push(coreFile);
          }
        }
      }

      // 🎯 SMART DISTRIBUTION SUGGESTION: If content is large and other files are empty
      const currentFileWordCount = this.countWords(storedMemory.content);
      if (currentFileWordCount > 1000 && templateFiles.length > 2) {
        console.log(`\n🧠 [SMART-DISTRIBUTION] Large content detected (${currentFileWordCount} words) in ${storedMemory.fileName}`);
        console.log(`💡 [SUGGESTION] Consider breaking this content into focused sections:`);

        // Analyze content and suggest specific distributions
        const distributionSuggestions = this.analyzeContentForDistribution(storedMemory.content, templateFiles);
        distributionSuggestions.forEach(suggestion => {
          console.log(`   • ${suggestion.targetFile}: ${suggestion.contentType} (${suggestion.reason})`);
        });
      }

      // Provide AI guidance based on completeness
      if (templateFiles.length > 0) {
        console.log(`\n🤖 [AI-GUIDANCE] Memory Bank Completeness Check:`);
        console.log(`✅ Files with real content (${contentFiles.length}): ${contentFiles.join(', ')}`);
        console.log(`⚠️  Files still needing content (${templateFiles.length}): ${templateFiles.join(', ')}`);
        console.log(`\n💡 [AI-SUGGESTION] To maximize AI context effectiveness:`);

        templateFiles.forEach(file => {
          const guidance = this.getFileSpecificGuidance(file);
          console.log(`   • ${file}: ${guidance}`);
        });

        console.log(`\n🎯 [NEXT-STEPS] Consider adding content to remaining ${templateFiles.length} files for complete project context.`);
      } else {
        console.log(`\n🎉 [AI-GUIDANCE] All 6 core files have real content! Memory bank is optimally structured.`);
      }
    } catch (error) {
      console.warn(`[AI-GUIDANCE] Could not provide completeness guidance: ${error}`);
    }
  }

  // 🧠 CONTENT DISTRIBUTION ANALYSIS: Suggest how to break up large content
  private analyzeContentForDistribution(content: string, emptyFiles: string[]): Array<{
    targetFile: string;
    contentType: string;
    reason: string;
  }> {
    const suggestions: Array<{ targetFile: string; contentType: string; reason: string; }> = [];
    const lowerContent = content.toLowerCase();

    // Analyze content sections and suggest distribution
    if (emptyFiles.includes('techContext.md') && (
      lowerContent.includes('javascript') || lowerContent.includes('html') ||
      lowerContent.includes('css') || lowerContent.includes('framework') ||
      lowerContent.includes('technology') || lowerContent.includes('dependencies')
    )) {
      suggestions.push({
        targetFile: 'techContext.md',
        contentType: 'Technical implementation details',
        reason: 'Contains technology stack and implementation specifics'
      });
    }

    if (emptyFiles.includes('systemPatterns.md') && (
      lowerContent.includes('architecture') || lowerContent.includes('component') ||
      lowerContent.includes('module') || lowerContent.includes('class') ||
      lowerContent.includes('design') || lowerContent.includes('pattern')
    )) {
      suggestions.push({
        targetFile: 'systemPatterns.md',
        contentType: 'Architecture and design patterns',
        reason: 'Contains system architecture and component design'
      });
    }

    if (emptyFiles.includes('productContext.md') && (
      lowerContent.includes('user') || lowerContent.includes('ux') ||
      lowerContent.includes('experience') || lowerContent.includes('workflow') ||
      lowerContent.includes('persona') || lowerContent.includes('problem')
    )) {
      suggestions.push({
        targetFile: 'productContext.md',
        contentType: 'User experience and product context',
        reason: 'Contains user-focused and product information'
      });
    }

    if (emptyFiles.includes('progress.md') && (
      lowerContent.includes('status') || lowerContent.includes('progress') ||
      lowerContent.includes('milestone') || lowerContent.includes('timeline') ||
      lowerContent.includes('done') || lowerContent.includes('remaining')
    )) {
      suggestions.push({
        targetFile: 'progress.md',
        contentType: 'Project status and progress',
        reason: 'Contains progress tracking and status information'
      });
    }

    return suggestions;
  }

  // 🔍 TEMPLATE DETECTION: Identify if content is still just a template
  private isTemplateContent(content: string): boolean {
    const oldTemplateIndicators = [
      '[Define', '[List', '[Describe', '[Document',
      'Define the problems', 'List user problems', 'Describe how',
      'Document important', 'Define core requirements'
    ];

    const newTemplateIndicators = [
      '[Brief description of the project]', '[Business/user value proposition]',
      '[specific functionality]', '[specific capability]', '[specific outcome]',
      '[measurable outcome]', '[specific achievement]', '[business impact]',
      '[what we\'re building]', '[who we\'re serving]', '[where it will run]',
      '[specific problem]', '[market area]', '[specific value]',
      '[React/Vue/Angular or Vanilla JS]', '[Webpack/Vite/Parcel]',
      '[npm/yarn/pnpm]', '[CI/CD pipeline details]'
    ];

    // Check for both old and new template patterns
    const hasOldTemplate = oldTemplateIndicators.some(indicator => content.includes(indicator));
    const hasNewTemplate = newTemplateIndicators.some(indicator => content.includes(indicator));

    // Also check for template structure patterns
    const templateStructurePatterns = [
      '**What We\'re Building**: [',
      '**Primary Goals**:',
      '**Must-Have Features**:',
      '**Problem Statement**: Users struggle with [',
      '**Frontend**: JavaScript ES6, HTML5, CSS3',
      '**Pattern**: [MVC/Component-based'
    ];

    const hasTemplateStructure = templateStructurePatterns.some(pattern => content.includes(pattern));

    return hasOldTemplate || hasNewTemplate || hasTemplateStructure;
  }

  // 💡 FILE-SPECIFIC GUIDANCE: Provide targeted suggestions for each core file
  private getFileSpecificGuidance(fileName: string): string {
    switch (fileName) {
      case 'projectbrief.md':
        return 'Add project goals, requirements, scope, and success criteria';
      case 'productContext.md':
        return 'Add user problems, solution approach, UX goals, and target users';
      case 'systemPatterns.md':
        return 'Add architecture decisions, design patterns, and component relationships';
      case 'techContext.md':
        return 'Add technology stack, development setup, dependencies, and constraints';
      case 'activeContext.md':
        return 'Add current work focus, recent changes, next steps, and active decisions';
      case 'progress.md':
        return 'Add what works, what\'s left to build, current status, and known issues';
      default:
        return 'Add relevant project content';
    }
  }

  // Clean, AI-optimized memory bank - no unused template code
}
