import { badRequest, ok, serverError } from "../../helpers/index.js";
import { setProjectContext } from "../../../shared/services/project-context-manager.js";
import {
  Controller,
  Request,
  Response,
  Validator,
  ProjectContextDetectionUseCase,
  DetectProjectContextRequest,
  DetectProjectContextResponse,
  ProjectContextRequest,
} from "./protocols.js";

/**
 * Project Context Detection Controller
 * Implements secure multi-layer project detection with isolation validation
 * Following MongoDB MCP and alioshr/memory-bank-mcp patterns
 */
export class ProjectContextDetectionController
  implements Controller<DetectProjectContextRequest, DetectProjectContextResponse>
{
  constructor(
    private readonly projectContextDetectionUseCase: ProjectContextDetectionUseCase,
    private readonly validator: Validator
  ) {}

  async handle(
    request: Request<DetectProjectContextRequest>
  ): Promise<Response<DetectProjectContextResponse>> {
    try {
      const validationError = this.validator.validate(request.body);
      if (validationError) {
        return badRequest(validationError);
      }

      const { 
        workingDirectory, 
        validateIsolation, 
        forceDetection, 
        preferredProjectName 
      } = request.body || {};

      // Convert to domain request
      const domainRequest: ProjectContextRequest = {
        workingDirectory: workingDirectory || process.cwd(),
        validateIsolation: validateIsolation !== false, // Default to true
        forceDetection,
        preferredProjectName
      };

      const result = await this.projectContextDetectionUseCase.detectProjectContext(domainRequest);

      // CRITICAL FIX: Set project context using master project context manager
      // This ensures 100% consistency across all operations
      if (result.success && result.result?.projectName) {
        await setProjectContext(result.result.projectName, result.result.workingDirectory);
      }

      return ok(result);
    } catch (error) {
      return serverError(error as Error);
    }
  }
}
