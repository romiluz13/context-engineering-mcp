import { Project, ProjectName } from "../../domain/entities/index.js";

export interface ProjectRepository {
  listProjects(): Promise<ProjectName[]>;
  projectExists(name: string): Promise<boolean>;
  ensureProject(name: string): Promise<void>;
}
