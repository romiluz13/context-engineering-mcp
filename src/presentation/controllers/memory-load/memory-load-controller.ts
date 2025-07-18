import { badRequest, ok, serverError, notFound } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  MemoryLoadUseCase,
  MemoryLoadRequest,
  MemoryLoadResponse,
} from "./protocols.js";

export class MemoryLoadController
  implements Controller<MemoryLoadRequest, MemoryLoadResponse>
{
  constructor(
    private readonly memoryLoadUseCase: MemoryLoadUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<MemoryLoadRequest>
  ): Promise<Response<MemoryLoadResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName } = request.body!;

      const memory = await this.memoryLoadUseCase.load({
        projectName,
        fileName
      });

      if (memory === null) {
        return notFound(fileName);
      }

      return ok(memory);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
