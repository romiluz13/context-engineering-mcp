import { 
  ProjectContextRequest, 
  ProjectContextResponse,
  ProjectDetectionResult,
  ProjectIsolationValidation 
} from "../entities/project-context.js";

/**
 * Project Context Detection Use Case
 * Implements secure multi-layer project detection with isolation validation
 * Based on MongoDB MCP patterns and alioshr/memory-bank-mcp analysis
 */
export interface ProjectContextDetectionUseCase {
  /**
   * Detect project context using multi-layer analysis
   * @param request Project detection parameters
   * @returns Project context with isolation validation
   */
  detectProjectContext(request: ProjectContextRequest): Promise<ProjectContextResponse>;

  /**
   * Validate project isolation to prevent cross-project contamination
   * @param projectName Detected project name
   * @param workingDirectory Current working directory
   * @returns Isolation validation result
   */
  validateProjectIsolation(
    projectName: string, 
    workingDirectory: string
  ): Promise<ProjectIsolationValidation>;

  /**
   * Check if project exists in memory bank
   * @param projectName Project name to check
   * @returns True if project exists in memory bank
   */
  checkProjectExistsInMemoryBank(projectName: string): Promise<boolean>;

  /**
   * Get list of existing projects for validation
   * @returns Array of existing project names
   */
  getExistingProjects(): Promise<string[]>;
}
