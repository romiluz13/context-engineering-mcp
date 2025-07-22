import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  ProjectContextRequest,
  ProjectContextResponse,
  ProjectDetectionResult,
  ProjectIsolationValidation
} from "../../../domain/entities/project-context.js";
import { ProjectContextDetectionUseCase } from "../../../domain/usecases/project-context-detection.js";
import { ProjectRepository } from "../../protocols/project-repository.js";
import { normalizeProjectName, detectProjectFromPath, detectProjectUniversally } from "../../../shared/utils/project-name-normalizer.js";

/**
 * Project Context Detection Implementation
 * Multi-layer project detection with isolation validation
 * Following MongoDB MCP and alioshr/memory-bank-mcp patterns
 */
export class ProjectContextDetection implements ProjectContextDetectionUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository
  ) {}

  async detectProjectContext(request: ProjectContextRequest): Promise<ProjectContextResponse> {
    try {
      const workingDirectory = request.workingDirectory || process.cwd();

      // UNIFIED DETECTION: Use the same logic as detectProjectForMCP for consistency
      let detectionResult: ProjectDetectionResult;

      if (request.preferredProjectName) {
        // If preferred name is provided, use it directly
        detectionResult = {
          projectName: normalizeProjectName(request.preferredProjectName),
          confidence: 100,
          detectionMethod: 'preferred',
          workingDirectory,
          gitContext: undefined,
          packageContext: undefined,
          directoryContext: undefined,
          isolationValidated: false,
          existsInMemoryBank: false,
          warnings: [],
          recommendations: [],
          signals: []
        };
      } else {
        // Use the same universal detection as MCP tools
        const universalDetection = await detectProjectUniversally(workingDirectory);
        detectionResult = {
          projectName: universalDetection.projectName,
          confidence: universalDetection.confidence,
          detectionMethod: universalDetection.detectionMethod,
          workingDirectory: universalDetection.workingDirectory,
          gitContext: undefined,
          packageContext: undefined,
          directoryContext: undefined,
          isolationValidated: false,
          existsInMemoryBank: false,
          warnings: [],
          recommendations: [],
          signals: universalDetection.signals.map(signal => ({
            type: signal.type,
            confidence: signal.confidence,
            projectName: signal.projectName,
            evidence: signal.evidence
          }))
        };
      }

      // Validate isolation if requested
      let isolation: ProjectIsolationValidation | undefined;
      if (request.validateIsolation !== false) {
        isolation = await this.validateProjectIsolation(
          detectionResult.projectName, 
          workingDirectory
        );
        detectionResult.isolationValidated = isolation.isValid;
      }

      // Check if project exists in memory bank
      detectionResult.existsInMemoryBank = await this.checkProjectExistsInMemoryBank(
        detectionResult.projectName
      );

      return {
        success: true,
        result: detectionResult,
        isolation,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      };
    }
  }

  // REMOVED: analyzeGitContext - now using unified detection from project-name-normalizer

  // REMOVED: analyzePackageContext - now using unified detection from project-name-normalizer

  // REMOVED: analyzeDirectoryContext - now using unified detection from project-name-normalizer

  // REMOVED: normalizeProjectName - now using shared utility from project-name-normalizer

  // REMOVED: determineProjectName - now using unified detection from project-name-normalizer

  async validateProjectIsolation(
    projectName: string, 
    workingDirectory: string
  ): Promise<ProjectIsolationValidation> {
    try {
      const existingProjects = await this.getExistingProjects();
      const conflictingProjects: string[] = [];
      const crossReferences: string[] = [];
      
      // Check for exact name conflicts
      if (existingProjects.includes(projectName)) {
        // This is actually OK - project can exist
      }

      // Check for similar names that might cause confusion
      const similarProjects = existingProjects.filter(existing => 
        existing !== projectName && (
          existing.toLowerCase().includes(projectName.toLowerCase()) ||
          projectName.toLowerCase().includes(existing.toLowerCase())
        )
      );

      if (similarProjects.length > 0) {
        conflictingProjects.push(...similarProjects);
      }

      // Calculate isolation score
      let isolationScore = 100;
      if (conflictingProjects.length > 0) {
        isolationScore -= conflictingProjects.length * 20;
      }

      const warnings: string[] = [];
      if (conflictingProjects.length > 0) {
        warnings.push(`Similar project names detected: ${conflictingProjects.join(', ')}`);
      }

      return {
        isValid: isolationScore >= 80,
        projectName,
        conflictingProjects,
        crossReferences,
        isolationScore: Math.max(0, isolationScore),
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        projectName,
        conflictingProjects: [],
        crossReferences: [],
        isolationScore: 0,
        warnings: [`Isolation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async checkProjectExistsInMemoryBank(projectName: string): Promise<boolean> {
    try {
      const existingProjects = await this.getExistingProjects();
      return existingProjects.includes(projectName);
    } catch (err) {
      // Project list access failed - this is expected
      return false;
    }
  }

  async getExistingProjects(): Promise<string[]> {
    try {
      return await this.projectRepository.listProjects();
    } catch (err) {
      // Project repository access failed - this is expected  
      return [];
    }
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (err) {
      // File access check failed - this is expected
      return false;
    }
  }

  /**
   * Smart fallback when normal project detection fails
   * REMOVED: Auto-selection logic that breaks project isolation
   * The system must ALWAYS respect the working directory context
   */
  private async smartProjectFallback(workingDirectory: string): Promise<{ name: string; confidence: number; method: string } | null> {
    try {
      const existingProjects = await this.getExistingProjects();

      if (existingProjects.length === 0) {
        // No existing projects - let normal fallback handle this
        return null;
      }

      // REMOVED: Auto-selection of existing projects - this breaks project isolation!
      // The system must ALWAYS respect the working directory, not auto-select existing projects

      // Return null to force directory-based detection
      return null;

    } catch (error) {
      console.error('[SMART-FALLBACK] Error accessing existing projects:', error);
      return null;
    }
  }
}
