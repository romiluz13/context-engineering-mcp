import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  MemoryStoreUseCase,
  MemoryStoreRequest,
  MemoryStoreResponse,
} from "./protocols.js";

export class MemoryStoreController
  implements Controller<MemoryStoreRequest, MemoryStoreResponse>
{
  constructor(
    private readonly memoryStoreUseCase: MemoryStoreUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<MemoryStoreRequest>
  ): Promise<Response<MemoryStoreResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName, content, tags } = request.body!;

      const memory = await this.memoryStoreUseCase.store({
        projectName,
        fileName,
        content,
        tags
      });

      return ok(
        `Memory ${fileName} stored successfully in project ${projectName} with ${memory.tags.length} tags`
      );
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
