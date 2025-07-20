import { Memory } from "../../../domain/entities/index.js";
import { MemoryStoreParams, MemoryStoreUseCase } from "../../../domain/usecases/memory-store.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";
import { ProjectRepository } from "../../protocols/project-repository.js";
import { MemoryType } from "../../../domain/entities/memory.js";

export class MemoryStore implements MemoryStoreUseCase {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async store(params: MemoryStoreParams): Promise<Memory> {
    const { projectName, fileName, content, tags = [] } = params;

    // Ensure project exists
    await this.projectRepository.ensureProject(projectName);

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

    const storedMemory = await this.memoryRepository.store(memory);

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

  // Clean, AI-optimized memory bank - no unused template code
}
