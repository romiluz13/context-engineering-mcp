import { 
  MemoryType, 
  MemoryTemplate, 
  MemoryValidationResult, 
  ValidationError, 
  ValidationWarning,
  TemplateSection 
} from '../entities/memory.js';
import { getTemplate } from '../entities/memory-templates.js';

/**
 * Template Validation Service
 * Validates memory content against structured templates
 * Designed to work in perfect harmony with existing MongoDB memory system
 */
export class TemplateValidationService {
  
  /**
   * Validate memory content against its template
   */
  async validateMemoryContent(
    content: string, 
    memoryType: MemoryType,
    fileName: string
  ): Promise<MemoryValidationResult> {
    const template = getTemplate(memoryType);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    try {
      // Validate template structure
      const structureValidation = this.validateStructure(content, template);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);

      // Validate required sections
      const sectionValidation = this.validateRequiredSections(content, template);
      errors.push(...sectionValidation.errors);
      warnings.push(...sectionValidation.warnings);

      // Validate content quality
      const qualityValidation = this.validateContentQuality(content, template);
      warnings.push(...qualityValidation.warnings);
      suggestions.push(...qualityValidation.suggestions);

      // Validate filename conventions
      const filenameValidation = this.validateFilename(fileName, memoryType);
      if (filenameValidation.error) {
        errors.push(filenameValidation.error);
      }
      if (filenameValidation.warning) {
        warnings.push(filenameValidation.warning);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'validation',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Validate overall template structure
   */
  private validateStructure(content: string, template: MemoryTemplate): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if content is not empty
    if (!content || content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Content cannot be empty',
        severity: 'error'
      });
      return { errors, warnings };
    }

    // Check for basic markdown structure (if template expects markdown)
    const hasMarkdownSections = template.schema.sections.some(s => s.format === 'markdown');
    if (hasMarkdownSections && !this.hasMarkdownHeaders(content)) {
      warnings.push({
        field: 'structure',
        message: 'Content should include markdown headers for better organization',
        suggestion: 'Add section headers using # or ## markdown syntax'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate required sections are present
   */
  private validateRequiredSections(content: string, template: MemoryTemplate): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const requiredSections = template.schema.sections.filter(s => s.required);
    
    for (const section of requiredSections) {
      if (!this.sectionExists(content, section)) {
        errors.push({
          field: section.name,
          message: `Required section "${section.name}" is missing`,
          severity: 'error'
        });
      }
    }

    // Check for optional sections that might be beneficial
    const optionalSections = template.schema.sections.filter(s => !s.required);
    for (const section of optionalSections) {
      if (!this.sectionExists(content, section)) {
        warnings.push({
          field: section.name,
          message: `Optional section "${section.name}" could enhance the memory`,
          suggestion: `Consider adding: ${section.description}`
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate content quality and completeness
   */
  private validateContentQuality(content: string, template: MemoryTemplate): {
    warnings: ValidationWarning[];
    suggestions: string[];
  } {
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 50) {
      warnings.push({
        field: 'content',
        message: 'Content seems quite brief',
        suggestion: 'Consider adding more detail to make the memory more useful'
      });
    }

    // Check for placeholder content
    const placeholderPatterns = [
      /\[.*?\]/g,  // [placeholder text]
      /TODO/gi,    // TODO items
      /FIXME/gi,   // FIXME items
      /\.\.\./g    // ellipsis
    ];

    for (const pattern of placeholderPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          field: 'content',
          message: 'Content contains placeholder text',
          suggestion: 'Replace placeholder text with actual content'
        });
        break;
      }
    }

    // Suggest improvements based on template type
    suggestions.push(...this.getTemplateSpecificSuggestions(content, template));

    return { warnings, suggestions };
  }

  /**
   * Validate filename follows conventions
   */
  private validateFilename(fileName: string, memoryType: MemoryType): {
    error?: ValidationError;
    warning?: ValidationWarning;
  } {
    // Check file extension
    if (!fileName.endsWith('.md')) {
      return {
        error: {
          field: 'fileName',
          message: 'Memory files should have .md extension',
          severity: 'error'
        }
      };
    }

    // Check naming convention
    const expectedName = `${memoryType}.md`;
    if (fileName !== expectedName) {
      return {
        warning: {
          field: 'fileName',
          message: `Filename "${fileName}" doesn't follow convention`,
          suggestion: `Consider using "${expectedName}" for consistency`
        }
      };
    }

    return {};
  }

  /**
   * Check if content has markdown headers
   */
  private hasMarkdownHeaders(content: string): boolean {
    return /^#+\s+.+$/m.test(content);
  }

  /**
   * Check if a section exists in the content
   */
  private sectionExists(content: string, section: TemplateSection): boolean {
    // Look for section header in various formats
    const patterns = [
      new RegExp(`^#+\\s*${section.name}\\s*$`, 'mi'),  // # Section Name
      new RegExp(`^\\*\\*${section.name}\\*\\*`, 'mi'), // **Section Name**
      new RegExp(`${section.name}:`, 'mi')               // Section Name:
    ];

    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Get template-specific suggestions
   */
  private getTemplateSpecificSuggestions(content: string, template: MemoryTemplate): string[] {
    const suggestions: string[] = [];

    switch (template.type) {
      case 'project-brief':
        if (!content.includes('Success Criteria')) {
          suggestions.push('Add measurable success criteria to track project goals');
        }
        break;

      case 'system-patterns':
        if (!content.includes('Architecture') && !content.includes('Pattern')) {
          suggestions.push('Include architectural patterns and design decisions');
        }
        break;

      case 'tech-context':
        if (!content.includes('version') && !content.includes('Version')) {
          suggestions.push('Include version information for technologies and dependencies');
        }
        break;

      case 'active-context':
        if (!content.includes(new Date().getFullYear().toString())) {
          suggestions.push('Include current date/timestamp for active context relevance');
        }
        break;

      case 'code-patterns':
        if (!content.includes('```') && !content.includes('`')) {
          suggestions.push('Include code examples to illustrate patterns');
        }
        break;

      case 'error-solutions':
        if (!content.includes('Solution') && !content.includes('Fix')) {
          suggestions.push('Include specific solutions and fixes for each error');
        }
        break;

      case 'implementation-rules':
        if (!content.includes('AI') && !content.includes('rule')) {
          suggestions.push('Include specific rules for AI behavior and decision making');
        }
        break;
    }

    return suggestions;
  }

  /**
   * Generate template content with placeholders
   */
  generateTemplateContent(memoryType: MemoryType, projectName?: string): string {
    const template = getTemplate(memoryType);
    let content = template.defaultContent;

    // Replace dynamic placeholders
    if (projectName) {
      content = content.replace(/\[Project Name\]/g, projectName);
    }
    
    content = content.replace(/\${new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}/g, 
      new Date().toISOString().split('T')[0]);

    return content;
  }

  /**
   * Extract structured data from content
   */
  extractStructuredData(content: string, memoryType: MemoryType): Record<string, any> {
    const template = getTemplate(memoryType);
    const structuredData: Record<string, any> = {};

    // Extract sections based on template schema
    for (const section of template.schema.sections) {
      const sectionContent = this.extractSectionContent(content, section.name);
      if (sectionContent) {
        structuredData[section.name] = sectionContent;
      }
    }

    return structuredData;
  }

  /**
   * Extract content for a specific section
   */
  private extractSectionContent(content: string, sectionName: string): string | null {
    // Look for section header and extract content until next header
    const headerPattern = new RegExp(`^#+\\s*${sectionName}\\s*$`, 'mi');
    const match = content.match(headerPattern);
    
    if (!match) return null;

    const startIndex = match.index! + match[0].length;
    const nextHeaderPattern = /^#+\s+/gm;
    nextHeaderPattern.lastIndex = startIndex;
    const nextMatch = nextHeaderPattern.exec(content);
    
    const endIndex = nextMatch ? nextMatch.index : content.length;
    return content.slice(startIndex, endIndex).trim();
  }
}
