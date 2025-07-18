import { badRequest, ok, serverError, notFound } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  MemoryRepository,
  MongoDBUpdateRequest,
  MongoDBUpdateResponse,
} from "./protocols.js";

export class MongoDBUpdateController
  implements Controller<MongoDBUpdateRequest, MongoDBUpdateResponse>
{
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<MongoDBUpdateRequest>
  ): Promise<Response<MongoDBUpdateResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName, content } = request.body!;

      const updatedMemory = await this.memoryRepository.update(projectName, fileName, content);
      
      if (!updatedMemory) {
        return notFound(`Memory ${fileName} not found in project ${projectName}`);
      }

      return ok(`Memory ${fileName} updated successfully in project ${projectName}`);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
