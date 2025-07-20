import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  ProjectContextRequest,
  ProjectContextResponse,
  ProjectDetectionResult,
  ProjectIsolationValidation,
  GitContext,
  PackageContext,
  DirectoryContext
} from "../../../domain/entities/project-context.js";
import { ProjectContextDetectionUseCase } from "../../../domain/usecases/project-context-detection.js";
import { ProjectRepository } from "../../protocols/project-repository.js";

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
      
      // Multi-layer detection
      const gitContext = await this.analyzeGitContext(workingDirectory);
      const packageContext = await this.analyzePackageContext(workingDirectory);
      const directoryContext = await this.analyzeDirectoryContext(workingDirectory);
      
      // Determine project name and confidence
      const detectionResult = await this.determineProjectName(
        gitContext, 
        packageContext, 
        directoryContext, 
        workingDirectory,
        request.preferredProjectName
      );

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

  private async analyzeGitContext(workingDirectory: string): Promise<GitContext> {
    try {
      const gitDir = path.join(workingDirectory, '.git');
      const isGitRepo = await this.pathExists(gitDir);
      
      if (!isGitRepo) {
        return { isGitRepo: false };
      }

      const context: GitContext = { isGitRepo: true };

      try {
        // Get remote URL
        const remoteUrl = execSync('git remote get-url origin', { 
          cwd: workingDirectory, 
          encoding: 'utf8' 
        }).trim();
        context.remoteUrl = remoteUrl;

        // Extract repo and org name from URL
        const urlMatch = remoteUrl.match(/[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
        if (urlMatch) {
          context.orgName = urlMatch[1];
          context.repoName = urlMatch[2];
        }
      } catch {}

      try {
        // Get current branch
        context.branch = execSync('git branch --show-current', { 
          cwd: workingDirectory, 
          encoding: 'utf8' 
        }).trim();
      } catch {}

      try {
        // Get last commit
        context.lastCommit = execSync('git rev-parse HEAD', { 
          cwd: workingDirectory, 
          encoding: 'utf8' 
        }).trim().substring(0, 8);
      } catch {}

      return context;
    } catch {
      return { isGitRepo: false };
    }
  }

  private async analyzePackageContext(workingDirectory: string): Promise<PackageContext> {
    const context: PackageContext = {
      hasPackageJson: false,
      hasRequirementsTxt: false,
      hasCargoToml: false,
      hasGoMod: false,
      hasPyprojectToml: false,
      hasComposerJson: false
    };

    // Check for package files
    context.hasPackageJson = await this.pathExists(path.join(workingDirectory, 'package.json'));
    context.hasRequirementsTxt = await this.pathExists(path.join(workingDirectory, 'requirements.txt'));
    context.hasCargoToml = await this.pathExists(path.join(workingDirectory, 'Cargo.toml'));
    context.hasGoMod = await this.pathExists(path.join(workingDirectory, 'go.mod'));
    context.hasPyprojectToml = await this.pathExists(path.join(workingDirectory, 'pyproject.toml'));
    context.hasComposerJson = await this.pathExists(path.join(workingDirectory, 'composer.json'));

    // Extract package information
    if (context.hasPackageJson) {
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(workingDirectory, 'package.json'), 'utf8')
        );
        context.packageName = packageJson.name;
        context.language = 'JavaScript/TypeScript';
        
        // Detect framework
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps.react) context.framework = 'React';
        else if (deps.vue) context.framework = 'Vue';
        else if (deps.angular) context.framework = 'Angular';
        else if (deps.next) context.framework = 'Next.js';
        else if (deps.express) context.framework = 'Express';
        else if (deps.fastify) context.framework = 'Fastify';
      } catch {}
    }

    if (context.hasCargoToml) {
      context.language = 'Rust';
      try {
        const cargoToml = await fs.readFile(path.join(workingDirectory, 'Cargo.toml'), 'utf8');
        const nameMatch = cargoToml.match(/name\s*=\s*"([^"]+)"/);
        if (nameMatch) context.packageName = nameMatch[1];
      } catch {}
    }

    if (context.hasGoMod) {
      context.language = 'Go';
      try {
        const goMod = await fs.readFile(path.join(workingDirectory, 'go.mod'), 'utf8');
        const moduleMatch = goMod.match(/module\s+([^\s]+)/);
        if (moduleMatch) {
          const modulePath = moduleMatch[1];
          context.packageName = modulePath.split('/').pop();
        }
      } catch {}
    }

    if (context.hasRequirementsTxt || context.hasPyprojectToml) {
      context.language = 'Python';
      if (context.hasPyprojectToml) {
        try {
          const pyproject = await fs.readFile(path.join(workingDirectory, 'pyproject.toml'), 'utf8');
          const nameMatch = pyproject.match(/name\s*=\s*"([^"]+)"/);
          if (nameMatch) context.packageName = nameMatch[1];
        } catch {}
      }
    }

    if (context.hasComposerJson) {
      context.language = 'PHP';
      try {
        const composerJson = JSON.parse(
          await fs.readFile(path.join(workingDirectory, 'composer.json'), 'utf8')
        );
        context.packageName = composerJson.name;
      } catch {}
    }

    return context;
  }

  private async analyzeDirectoryContext(workingDirectory: string): Promise<DirectoryContext> {
    const context: DirectoryContext = {
      hasReadme: false,
      hasDockerfile: false,
      hasDockerCompose: false,
      hasVscode: false,
      hasGitignore: false,
      hasLicense: false,
      projectMarkers: [],
      rootFiles: [],
      directories: []
    };

    try {
      const entries = await fs.readdir(workingDirectory, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          context.rootFiles.push(entry.name);
          
          const lowerName = entry.name.toLowerCase();
          if (lowerName.startsWith('readme')) context.hasReadme = true;
          if (lowerName === 'dockerfile') context.hasDockerfile = true;
          if (lowerName.includes('docker-compose')) context.hasDockerCompose = true;
          if (lowerName === '.gitignore') context.hasGitignore = true;
          if (lowerName.startsWith('license')) context.hasLicense = true;
          
          // Project markers
          if (['package.json', 'Cargo.toml', 'go.mod', 'requirements.txt', 'pyproject.toml', 'composer.json'].includes(entry.name)) {
            context.projectMarkers.push(entry.name);
          }
        } else if (entry.isDirectory()) {
          context.directories.push(entry.name);
          
          if (entry.name === '.vscode') context.hasVscode = true;
        }
      }
    } catch {}

    return context;
  }

  /**
   * Normalizes a project name to ensure consistency across different sources
   * Follows MongoDB best practices: lowercase, hyphen-separated
   */
  private normalizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .trim();
  }

  private async determineProjectName(
    gitContext: GitContext,
    packageContext: PackageContext,
    directoryContext: DirectoryContext,
    workingDirectory: string,
    preferredName?: string
  ): Promise<ProjectDetectionResult> {
    const candidates: Array<{ name: string; confidence: number; method: string }> = [];

    // Preferred name gets highest priority
    if (preferredName) {
      candidates.push({
        name: this.normalizeProjectName(preferredName),
        confidence: 100,
        method: 'preferred'
      });
    }

    // Git-based detection
    if (gitContext.repoName) {
      candidates.push({
        name: this.normalizeProjectName(gitContext.repoName),
        confidence: 90,
        method: 'git-repo'
      });
    }

    // Package-based detection
    if (packageContext.packageName) {
      const cleanName = packageContext.packageName.split('/').pop() || packageContext.packageName;
      candidates.push({
        name: this.normalizeProjectName(cleanName),
        confidence: 85,
        method: 'package-name'
      });
    }

    // Directory-based detection
    const dirName = path.basename(workingDirectory);
    if (dirName && dirName !== '.' && dirName !== '/') {
      candidates.push({
        name: this.normalizeProjectName(dirName),
        confidence: 70,
        method: 'directory-name'
      });
    }

    // Ensure we have at least one candidate (fallback to directory name)
    if (candidates.length === 0) {
      const dirName = path.basename(workingDirectory);
      candidates.push({
        name: this.normalizeProjectName(dirName),
        confidence: 70,
        method: 'directory-name'
      });
    }

    // Select best candidate
    let bestCandidate = candidates.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // SMART FALLBACK: If no good candidate or empty project name, check existing projects
    if (bestCandidate.confidence < 80 || !bestCandidate.name || bestCandidate.name.trim() === '' || bestCandidate.name === '/') {
      const fallbackCandidate = await this.smartProjectFallback(workingDirectory);
      if (fallbackCandidate) {
        bestCandidate = fallbackCandidate;
      }
    }

    const detectionMethod = bestCandidate.method.includes('git') ? 'git' :
                           bestCandidate.method.includes('package') ? 'package' :
                           bestCandidate.method.includes('directory') ? 'directory' : 'hybrid';

    return {
      projectName: bestCandidate.name,
      confidence: bestCandidate.confidence,
      detectionMethod,
      workingDirectory,
      gitContext,
      packageContext,
      directoryContext,
      isolationValidated: false,
      existsInMemoryBank: false,
      warnings: [],
      recommendations: []
    };
  }

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
    } catch {
      return false;
    }
  }

  async getExistingProjects(): Promise<string[]> {
    try {
      return await this.projectRepository.listProjects();
    } catch {
      return [];
    }
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
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
