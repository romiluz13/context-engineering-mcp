import { ProjectName } from "../entities/index.js";

export interface ListProjectsUseCase {
  listProjects(): Promise<ProjectName[]>;
}
