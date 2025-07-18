import { Memory, Project } from "../entities/index.js";

export interface ProjectContextResult {
  project: Project;
  memories: Memory[];
  totalWords: number;
  commonTags: string[];
}

export interface ProjectContextParams {
  projectName: string;
  limit?: number;
}

export interface ProjectContextUseCase {
  getContext(params: ProjectContextParams): Promise<ProjectContextResult>;
}
