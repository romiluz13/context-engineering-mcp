import {
  ListProjectsUseCase,
  ProjectName,
  ProjectRepository,
} from "./list-projects-protocols.js";

export class ListProjects implements ListProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async listProjects(): Promise<ProjectName[]> {
    return this.projectRepository.listProjects();
  }
}
