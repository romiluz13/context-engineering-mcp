import { Memory } from "../../../domain/entities/index.js";
import { MemoryStoreParams, MemoryStoreUseCase } from "../../../domain/usecases/memory-store.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";
import { ProjectRepository } from "../../protocols/project-repository.js";

export class MemoryStore implements MemoryStoreUseCase {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async store(params: MemoryStoreParams): Promise<Memory> {
    const { projectName, fileName, content, tags = [] } = params;

    // Ensure project exists
    await this.projectRepository.ensureProject(projectName);

    // Auto-generate tags if none provided
    const finalTags = tags.length > 0 ? tags : this.generateTags(content, fileName);

    const memory: Memory = {
      projectName,
      fileName,
      content,
      tags: finalTags,
      lastModified: new Date(),
      wordCount: this.countWords(content)
    };

    const storedMemory = await this.memoryRepository.store(memory);
    
    // Update project memory count
    // Note: This could be optimized with a single transaction in the future
    
    return storedMemory;
  }

  private generateTags(content: string, fileName: string): string[] {
    const tags: string[] = [];
    
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
}
