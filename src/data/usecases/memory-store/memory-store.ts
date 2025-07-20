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

    // 🧠 STEP 1: SMART TEMPLATE DETECTION
    const detectedTemplate = this.detectTemplateType(fileName, content);

    // 🧠 STEP 2: AUTO-DEPENDENCY MANAGEMENT (like Cline's hierarchy)
    await this.ensureTemplateDependencies(projectName, detectedTemplate, fileName);

    // 🧠 STEP 3: INTELLIGENT TAG GENERATION
    const finalTags = tags.length > 0 ? tags : this.generateIntelligentTags(content, fileName, detectedTemplate);

    const memory: Memory = {
      projectName,
      fileName,
      content,
      tags: finalTags,
      lastModified: new Date(),
      wordCount: this.countWords(content),
      // Enhanced with template intelligence
      memoryType: detectedTemplate,
      templateVersion: '1.0.0',
      relationships: await this.generateRelationships(projectName, fileName, detectedTemplate, content)
    };

    const storedMemory = await this.memoryRepository.store(memory);

    // 🧠 STEP 4: AUTO-UPDATE DEPENDENT MEMORIES
    await this.updateDependentMemories(projectName, fileName, detectedTemplate, content);

    return storedMemory;
  }

  // 🧠 STEP 1: SMART TEMPLATE DETECTION
  private detectTemplateType(fileName: string, content: string): MemoryType | undefined {
    const lowerFileName = fileName.toLowerCase();

    // Cline-style template detection
    if (lowerFileName.includes('projectbrief') || lowerFileName.includes('project-brief')) {
      return 'project-brief';
    }
    if (lowerFileName.includes('activecontext') || lowerFileName.includes('active-context')) {
      return 'active-context';
    }
    if (lowerFileName.includes('systempatterns') || lowerFileName.includes('system-patterns')) {
      return 'system-patterns';
    }
    if (lowerFileName.includes('techcontext') || lowerFileName.includes('tech-context')) {
      return 'tech-context';
    }
    if (lowerFileName.includes('progress')) {
      return 'progress-tracking';
    }
    if (lowerFileName.includes('productcontext') || lowerFileName.includes('product-context')) {
      return 'active-context'; // Map to our closest equivalent
    }

    // Content-based detection
    if (content.includes('## Project Overview') || content.includes('# Project Brief')) {
      return 'project-brief';
    }
    if (content.includes('## Current Focus') || content.includes('## Active Work')) {
      return 'active-context';
    }
    if (content.includes('## Architecture') || content.includes('## System Design')) {
      return 'system-patterns';
    }
    if (content.includes('## Technologies') || content.includes('## Tech Stack')) {
      return 'tech-context';
    }

    return undefined; // Unstructured memory
  }

  // 🧠 STEP 2: AUTO-DEPENDENCY MANAGEMENT (Cline's Hierarchy)
  private async ensureTemplateDependencies(projectName: string, templateType: MemoryType | undefined, fileName: string): Promise<void> {
    if (!templateType) return;

    // Cline's hierarchy: projectbrief.md is foundation for everything
    if (templateType !== 'project-brief') {
      const projectBriefExists = await this.memoryRepository.findByFileName(projectName, 'projectbrief.md') ||
                                 await this.memoryRepository.findByFileName(projectName, 'project-brief.md');

      if (!projectBriefExists) {
        // Auto-create project brief template
        const projectBriefContent = this.generateProjectBriefTemplate(projectName);
        await this.memoryRepository.store({
          projectName,
          fileName: 'projectbrief.md',
          content: projectBriefContent,
          tags: ['foundation', 'project-brief', 'auto-generated'],
          lastModified: new Date(),
          wordCount: this.countWords(projectBriefContent),
          memoryType: 'project-brief',
          templateVersion: '1.0.0'
        });
      }
    }

    // activeContext.md depends on systemPatterns.md and techContext.md
    if (templateType === 'active-context') {
      const systemPatternsExists = await this.memoryRepository.findByFileName(projectName, 'systempatterns.md') ||
                                   await this.memoryRepository.findByFileName(projectName, 'system-patterns.md');
      const techContextExists = await this.memoryRepository.findByFileName(projectName, 'techcontext.md') ||
                                await this.memoryRepository.findByFileName(projectName, 'tech-context.md');

      if (!systemPatternsExists) {
        const systemPatternsContent = this.generateSystemPatternsTemplate(projectName);
        await this.memoryRepository.store({
          projectName,
          fileName: 'systempatterns.md',
          content: systemPatternsContent,
          tags: ['foundation', 'system-patterns', 'auto-generated'],
          lastModified: new Date(),
          wordCount: this.countWords(systemPatternsContent),
          memoryType: 'system-patterns',
          templateVersion: '1.0.0'
        });
      }

      if (!techContextExists) {
        const techContextContent = this.generateTechContextTemplate(projectName);
        await this.memoryRepository.store({
          projectName,
          fileName: 'techcontext.md',
          content: techContextContent,
          tags: ['foundation', 'tech-context', 'auto-generated'],
          lastModified: new Date(),
          wordCount: this.countWords(techContextContent),
          memoryType: 'tech-context',
          templateVersion: '1.0.0'
        });
      }
    }
  }

  private generateIntelligentTags(content: string, fileName: string, templateType: MemoryType | undefined): string[] {
    const tags: string[] = [];

    // Template-specific tags
    if (templateType) {
      tags.push(templateType);

      // Hierarchy tags (like Cline's structure)
      if (['project-brief', 'system-patterns', 'tech-context'].includes(templateType)) {
        tags.push('foundation');
      } else if (['active-context'].includes(templateType)) {
        tags.push('active');
      } else if (['progress-tracking'].includes(templateType)) {
        tags.push('tracking');
      }
    }

    // Extract tags from filename
    const fileBaseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const fileWords = fileBaseName.split(/[-_\s]+/).filter(word => word.length > 2);
    tags.push(...fileWords);

    // Extract common technical terms from content
    const techTerms = [
      'auth', 'authentication', 'authorization', 'security',
      'api', 'rest', 'graphql', 'database', 'mongodb', 'sql',
      'react', 'vue', 'angular', 'javascript', 'typescript',
      'node', 'express', 'fastify', 'nest',
      'test', 'testing', 'unit', 'integration',
      'docker', 'kubernetes', 'deployment', 'ci', 'cd',
      'error', 'bug', 'fix', 'issue', 'problem',
      'feature', 'enhancement', 'improvement',
      'config', 'configuration', 'setup', 'install'
    ];

    const contentLower = content.toLowerCase();
    techTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.push(term);
      }
    });

    // Remove duplicates and limit to 10 tags
    return [...new Set(tags)].slice(0, 10);
  }

  private countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // 🧠 STEP 3: INTELLIGENT RELATIONSHIP GENERATION
  private async generateRelationships(projectName: string, fileName: string, templateType: MemoryType | undefined, content: string) {
    if (!templateType) return undefined;

    const relationships = {
      dependsOn: [] as string[],
      influences: [] as string[],
      relatedTo: [] as string[],
      hierarchyLevel: 0
    };

    // Cline's hierarchy relationships
    switch (templateType) {
      case 'project-brief':
        relationships.hierarchyLevel = 0;
        relationships.influences = ['systempatterns.md', 'techcontext.md', 'activecontext.md'];
        break;

      case 'system-patterns':
      case 'tech-context':
        relationships.hierarchyLevel = 0;
        relationships.dependsOn = ['projectbrief.md'];
        relationships.influences = ['activecontext.md'];
        break;

      case 'active-context':
        relationships.hierarchyLevel = 1;
        relationships.dependsOn = ['projectbrief.md', 'systempatterns.md', 'techcontext.md'];
        relationships.influences = ['progress.md'];
        break;

      case 'progress-tracking':
        relationships.hierarchyLevel = 2;
        relationships.dependsOn = ['activecontext.md'];
        break;
    }

    return relationships;
  }

  // 🧠 STEP 4: AUTO-UPDATE DEPENDENT MEMORIES
  private async updateDependentMemories(projectName: string, fileName: string, templateType: MemoryType | undefined, content: string): Promise<void> {
    if (!templateType) return;

    // When activeContext.md changes, auto-update progress.md
    if (templateType === 'active-context') {
      const progressFile = await this.memoryRepository.findByFileName(projectName, 'progress.md');
      if (progressFile) {
        // Extract recent changes and update progress
        const recentChanges = this.extractRecentChanges(content);
        if (recentChanges.length > 0) {
          const updatedProgress = this.updateProgressContent(progressFile.content, recentChanges);
          await this.memoryRepository.store({
            ...progressFile,
            content: updatedProgress,
            lastModified: new Date(),
            wordCount: this.countWords(updatedProgress),
            tags: [...progressFile.tags, 'auto-updated']
          });
        }
      }
    }
  }

  // 🧠 TEMPLATE GENERATION METHODS
  private generateProjectBriefTemplate(projectName: string): string {
    return `# Project Brief: ${projectName}

## Project Overview
[Brief description of what this project does and why it exists]

## Core Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

## Success Criteria
- [Criteria 1]
- [Criteria 2]
- [Criteria 3]

## Constraints
- [Constraint 1]
- [Constraint 2]

---
*Auto-generated by MongoDB Memory Bank MCP*`;
  }

  private generateSystemPatternsTemplate(projectName: string): string {
    return `# System Patterns: ${projectName}

## Architecture Overview
[High-level system architecture description]

## Key Design Patterns
- [Pattern 1]
- [Pattern 2]
- [Pattern 3]

## Component Relationships
[How major components interact]

## Critical Implementation Paths
- [Path 1]
- [Path 2]
- [Path 3]

## Technical Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]

---
*Auto-generated by MongoDB Memory Bank MCP*`;
  }

  private generateTechContextTemplate(projectName: string): string {
    return `# Tech Context: ${projectName}

## Technology Stack
- **Language**: [Primary language]
- **Framework**: [Main framework]
- **Database**: [Database technology]
- **Infrastructure**: [Deployment/hosting]

## Development Setup
[How to set up the development environment]

## Dependencies
### Core Dependencies
- [Dependency 1]
- [Dependency 2]

### Development Dependencies
- [Dev dependency 1]
- [Dev dependency 2]

## Technical Constraints
- [Constraint 1]
- [Constraint 2]

## Tool Usage Patterns
[How tools are used in this project]

---
*Auto-generated by MongoDB Memory Bank MCP*`;
  }

  private extractRecentChanges(content: string): string[] {
    // Extract recent changes from activeContext.md content
    const changes: string[] = [];
    const lines = content.split('\n');

    let inRecentChanges = false;
    for (const line of lines) {
      if (line.includes('Recent Changes') || line.includes('Recent Work')) {
        inRecentChanges = true;
        continue;
      }
      if (inRecentChanges && line.startsWith('#')) {
        break; // End of section
      }
      if (inRecentChanges && line.trim().startsWith('-')) {
        changes.push(line.trim());
      }
    }

    return changes;
  }

  private updateProgressContent(currentProgress: string, recentChanges: string[]): string {
    // Simple implementation: append recent changes to progress
    const timestamp = new Date().toISOString().split('T')[0];
    const newSection = `\n## ${timestamp} - Auto-updated from Active Context\n${recentChanges.join('\n')}\n`;
    return currentProgress + newSection;
  }
}
