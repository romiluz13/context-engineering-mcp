import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  MemoryDiscoverUseCase,
  MemoryDiscoverRequest,
  MemoryDiscoverResponse,
} from "./protocols.js";

export class MemoryDiscoverController
  implements Controller<MemoryDiscoverRequest, MemoryDiscoverResponse>
{
  constructor(
    private readonly memoryDiscoverUseCase: MemoryDiscoverUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<MemoryDiscoverRequest>
  ): Promise<Response<MemoryDiscoverResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { projectName, fileName, limit } = request.body!;

      const results = await this.memoryDiscoverUseCase.discover({
        projectName,
        fileName,
        limit
      });

      return ok(results);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
