import { ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  ListProjectsUseCase,
  MongoDBListProjectsRequest,
  MongoDBListProjectsResponse,
} from "./protocols.js";

export class MongoDBListProjectsController
  implements Controller<MongoDBListProjectsRequest, MongoDBListProjectsResponse>
{
  constructor(private readonly listProjectsUseCase: ListProjectsUseCase) {}

  async handle(
    request: Request<MongoDBListProjectsRequest>
  ): Promise<Response<MongoDBListProjectsResponse>> {
    try {
      const projects = await this.listProjectsUseCase.listProjects();
      return ok(projects);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
