import { badRequest, ok, serverError } from "../../helpers/index.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  MemorySearchUseCase,
  MemorySearchRequest,
  MemorySearchResponse,
} from "./protocols.js";

export class MemorySearchController
  implements Controller<MemorySearchRequest, MemorySearchResponse>
{
  constructor(
    private readonly memorySearchUseCase: MemorySearchUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<MemorySearchRequest>
  ): Promise<Response<MemorySearchResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { query, projectName, tags, limit, useSemanticSearch } = request.body!;

      const results = await this.memorySearchUseCase.search({
        query,
        projectName,
        tags,
        limit,
        useSemanticSearch
      });

      return ok(results);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
