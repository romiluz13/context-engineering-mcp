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
      
      const fileInfos: FileInfo[] = memories.map(memory => ({
        fileName: memory.fileName,
        lastModified: memory.lastModified.toISOString(),
        wordCount: memory.wordCount,
        tags: memory.tags
      }));

      return ok(fileInfos);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
