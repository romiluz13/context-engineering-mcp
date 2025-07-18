import { Memory, Project } from "../../../domain/entities/index.js";
import { ProjectContextParams, ProjectContextResult, ProjectContextUseCase } from "../../../domain/usecases/project-context.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";
import { ProjectRepository } from "../../protocols/project-repository.js";

export class ProjectContext implements ProjectContextUseCase {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async getContext(params: ProjectContextParams): Promise<ProjectContextResult> {
    const { projectName, limit = 20 } = params;

    // Ensure project exists
    await this.projectRepository.ensureProject(projectName);

    // Get project stats
    const stats = await this.memoryRepository.getProjectStats(projectName);
    
    // Get recent memories
    const memories = await this.memoryRepository.listByProject(projectName);
    const limitedMemories = memories.slice(0, limit);

    // Create project object
    const project: Project = {
      name: projectName,
      createdAt: new Date(), // This would come from actual project data in full implementation
      lastAccessed: stats.lastActivity,
      memoryCount: stats.totalMemories,
      tags: stats.commonTags
    };

    return {
      project,
      memories: limitedMemories,
      totalWords: stats.totalWords,
      commonTags: stats.commonTags
    };
  }
}
