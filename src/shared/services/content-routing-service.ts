/**
 * Content Routing Service
 * Implements intelligent content routing to maintain clean 6-file Cline structure
 * Prevents content accumulation by routing new content to appropriate core files
 */

import { CLINE_CORE_FILES } from './cline-memory-structure.js';

export interface ContentRoutingResult {
  targetFile: string;
  shouldMerge: boolean;
  mergeStrategy: 'append' | 'merge' | 'replace';
  confidence: number;
  reasoning: string;
}

export interface ContentAnalysis {
  contentType: 'technical' | 'architectural' | 'product' | 'project' | 'active' | 'progress';
  keywords: string[];
  isAnalysis: boolean;
  isUpdate: boolean;
}

export class ContentRoutingService {
  
  /**
   * 🎯 CORE ROUTING LOGIC: Analyze content and determine target core file
   */
  public static routeContent(fileName: string, content: string, existingFiles: string[]): ContentRoutingResult {
    // 1. If it's already a core file, route to itself
    if (Object.values(CLINE_CORE_FILES).includes(fileName as any)) {
      return {
        targetFile: fileName,
        shouldMerge: true,
        mergeStrategy: 'merge',
        confidence: 100,
        reasoning: 'Direct core file match'
      };
    }

    // 2. Analyze content to determine appropriate core file
    const analysis = this.analyzeContent(fileName, content);
    const targetFile = this.determineTargetFile(analysis, existingFiles);

    return {
      targetFile,
      shouldMerge: true,
      mergeStrategy: analysis.isAnalysis ? 'merge' : 'append',
      confidence: this.calculateConfidence(analysis, targetFile),
      reasoning: this.generateReasoning(analysis, targetFile)
    };
  }

  /**
   * 🔍 CONTENT ANALYSIS: Determine content type and characteristics
   */
  private static analyzeContent(fileName: string, content: string): ContentAnalysis {
    const lowerFileName = fileName.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    // Extract keywords for analysis
    const keywords = this.extractKeywords(lowerContent);
    
    // Determine if this is analysis content (should be merged, not appended)
    const isAnalysis = lowerFileName.includes('analysis') || 
                      lowerContent.includes('analysis') ||
                      lowerContent.includes('comparison') ||
                      lowerContent.includes('assessment') ||
                      lowerContent.includes('evaluation');

    // Determine if this is an update to existing content
    const isUpdate = lowerContent.includes('update') || 
                    lowerContent.includes('progress') ||
                    lowerContent.includes('status');

    // Determine content type based on keywords and patterns
    let contentType: ContentAnalysis['contentType'] = 'active'; // default

    if (this.hasKeywords(keywords, ['mongodb', 'database', 'vector', 'search', 'api', 'configuration', 'setup'])) {
      contentType = 'technical';
    } else if (this.hasKeywords(keywords, ['architecture', 'pattern', 'design', 'structure', 'implementation'])) {
      contentType = 'architectural';
    } else if (this.hasKeywords(keywords, ['market', 'competitive', 'product', 'user', 'business'])) {
      contentType = 'product';
    } else if (this.hasKeywords(keywords, ['project', 'goal', 'objective', 'mission', 'brief'])) {
      contentType = 'project';
    } else if (this.hasKeywords(keywords, ['progress', 'status', 'milestone', 'roadmap', 'timeline'])) {
      contentType = 'progress';
    }

    return {
      contentType,
      keywords,
      isAnalysis,
      isUpdate
    };
  }

  /**
   * 🎯 TARGET FILE DETERMINATION: Map content type to core file
   */
  private static determineTargetFile(analysis: ContentAnalysis, existingFiles: string[]): string {
    const mapping = {
      'technical': CLINE_CORE_FILES.TECH_CONTEXT,
      'architectural': CLINE_CORE_FILES.SYSTEM_PATTERNS,
      'product': CLINE_CORE_FILES.PRODUCT_CONTEXT,
      'project': CLINE_CORE_FILES.PROJECT_BRIEF,
      'active': CLINE_CORE_FILES.ACTIVE_CONTEXT,
      'progress': CLINE_CORE_FILES.PROGRESS
    };

    const targetFile = mapping[analysis.contentType];

    // Ensure target file exists in the project
    if (existingFiles.includes(targetFile)) {
      return targetFile;
    }

    // Fallback to activeContext.md if target doesn't exist
    return existingFiles.includes(CLINE_CORE_FILES.ACTIVE_CONTEXT) 
      ? CLINE_CORE_FILES.ACTIVE_CONTEXT 
      : existingFiles[0] || CLINE_CORE_FILES.ACTIVE_CONTEXT;
  }

  /**
   * 🔍 KEYWORD EXTRACTION: Extract relevant keywords from content
   */
  private static extractKeywords(content: string): string[] {
    // Remove common words and extract meaningful terms
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isCommonWord(word));

    // Return unique keywords
    return [...new Set(words)];
  }

  /**
   * 🚫 COMMON WORD FILTER: Filter out common English words
   */
  private static isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been',
      'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like',
      'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
    ]);
    return commonWords.has(word);
  }

  /**
   * ✅ KEYWORD MATCHING: Check if content has specific keywords
   */
  private static hasKeywords(keywords: string[], targetKeywords: string[]): boolean {
    return targetKeywords.some(target => 
      keywords.some(keyword => keyword.includes(target) || target.includes(keyword))
    );
  }

  /**
   * 📊 CONFIDENCE CALCULATION: Calculate routing confidence score
   */
  private static calculateConfidence(analysis: ContentAnalysis, targetFile: string): number {
    let confidence = 70; // base confidence

    // Increase confidence for clear content type matches
    if (analysis.contentType === 'technical' && targetFile === CLINE_CORE_FILES.TECH_CONTEXT) confidence += 20;
    if (analysis.contentType === 'architectural' && targetFile === CLINE_CORE_FILES.SYSTEM_PATTERNS) confidence += 20;
    if (analysis.contentType === 'product' && targetFile === CLINE_CORE_FILES.PRODUCT_CONTEXT) confidence += 20;
    if (analysis.contentType === 'project' && targetFile === CLINE_CORE_FILES.PROJECT_BRIEF) confidence += 20;
    if (analysis.contentType === 'progress' && targetFile === CLINE_CORE_FILES.PROGRESS) confidence += 20;

    // Increase confidence for analysis content (should be merged)
    if (analysis.isAnalysis) confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * 💭 REASONING GENERATION: Generate human-readable routing reasoning
   */
  private static generateReasoning(analysis: ContentAnalysis, targetFile: string): string {
    const fileNames: Record<string, string> = {
      [CLINE_CORE_FILES.TECH_CONTEXT]: 'technical context',
      [CLINE_CORE_FILES.SYSTEM_PATTERNS]: 'system patterns',
      [CLINE_CORE_FILES.PRODUCT_CONTEXT]: 'product context',
      [CLINE_CORE_FILES.PROJECT_BRIEF]: 'project brief',
      [CLINE_CORE_FILES.ACTIVE_CONTEXT]: 'active context',
      [CLINE_CORE_FILES.PROGRESS]: 'progress tracking'
    };

    const fileName = fileNames[targetFile] || 'core file';

    return `Content type '${analysis.contentType}' routed to ${fileName} based on keyword analysis`;
  }

  /**
   * 🔄 CONTENT MERGING: Intelligently merge new content with existing content
   */
  public static mergeContent(existingContent: string, newContent: string, strategy: 'append' | 'merge' | 'replace'): string {
    switch (strategy) {
      case 'replace':
        return newContent;
        
      case 'append':
        return existingContent + '\n\n---\n\n' + newContent;
        
      case 'merge':
      default:
        // Intelligent merge: avoid duplication, organize by sections
        return this.intelligentMerge(existingContent, newContent);
    }
  }

  /**
   * 🧠 INTELLIGENT MERGE: Smart content merging avoiding duplication
   */
  private static intelligentMerge(existingContent: string, newContent: string): string {
    // If new content is significantly different, append it
    if (this.calculateSimilarity(existingContent, newContent) < 0.3) {
      return existingContent + '\n\n## Additional Content\n\n' + newContent;
    }

    // If similar, try to merge sections intelligently
    const existingSections = this.extractSections(existingContent);
    const newSections = this.extractSections(newContent);

    // Merge sections, preferring newer content for duplicates
    const mergedSections = { ...existingSections, ...newSections };
    
    return Object.entries(mergedSections)
      .map(([title, content]) => `## ${title}\n\n${content}`)
      .join('\n\n');
  }

  /**
   * 📊 SIMILARITY CALCULATION: Calculate content similarity (simple implementation)
   */
  private static calculateSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * 📑 SECTION EXTRACTION: Extract sections from markdown content
   */
  private static extractSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = 'Introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = line.replace('## ', '').trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }
}
