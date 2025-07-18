import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { ListProjectsUseCase } from "../../../domain/usecases/list-projects.js";
import { ProjectName } from "../../../domain/entities/index.js";

export interface MongoDBListProjectsRequest {
  // No parameters needed
}

export type MongoDBListProjectsResponse = ProjectName[];

export { Controller, Request, Response, Validator, ListProjectsUseCase };
