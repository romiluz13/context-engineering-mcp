import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  MemoryRepository,
  MongoDBListProjectFilesRequest,
  MongoDBListProjectFilesResponse,
  FileInfo,
} from "./protocols.js";

export class MongoDBListProjectFilesController
  implements Controller<MongoDBListProjectFilesRequest, MongoDBListProjectFilesResponse>
{
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<MongoDBListProjectFilesRequest>
  ): Promise<Response<MongoDBListProjectFilesResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName } = request.body!;

      const memories = await this.memoryRepository.listByProject(projectName);

      // Return simple string array like original alioshr implementation
      // This ensures backward compatibility with existing MCP clients
      const fileNames: string[] = memories.map(memory => memory.fileName);

      return ok(fileNames);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
