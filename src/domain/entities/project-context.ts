/**
 * Project Context Detection Entity
 * Based on latest MongoDB MCP patterns and alioshr/memory-bank-mcp analysis
 */

export interface GitContext {
  isGitRepo: boolean;
  remoteUrl?: string;
  branch?: string;
  repoName?: string;
  orgName?: string;
  lastCommit?: string;
}

export interface PackageContext {
  hasPackageJson: boolean;
  hasRequirementsTxt: boolean;
  hasCargoToml: boolean;
  hasGoMod: boolean;
  hasPyprojectToml: boolean;
  hasComposerJson: boolean;
  packageName?: string;
  language?: string;
  framework?: string;
}

export interface DirectoryContext {
  hasReadme: boolean;
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasVscode: boolean;
  hasGitignore: boolean;
  hasLicense: boolean;
  projectMarkers: string[];
  rootFiles: string[];
  directories: string[];
}

export interface ProjectDetectionResult {
  projectName: string;
  confidence: number;
  detectionMethod: 'git' | 'package' | 'directory' | 'hybrid' | 'preferred' | 'git-root' | 'package-name' | 'directory-name' | 'recent-activity' | 'file-markers' | 'smart-default';
  workingDirectory: string;
  gitContext?: GitContext;
  packageContext?: PackageContext;
  directoryContext?: DirectoryContext;
  isolationValidated: boolean;
  existsInMemoryBank: boolean;
  warnings: string[];
  recommendations: string[];
  signals?: Array<{
    type: string;
    confidence: number;
    projectName: string;
    evidence: string[];
  }>;
}

export interface ProjectIsolationValidation {
  isValid: boolean;
  projectName: string;
  conflictingProjects: string[];
  crossReferences: string[];
  isolationScore: number;
  warnings: string[];
}

export interface ProjectContextRequest {
  workingDirectory?: string;
  validateIsolation?: boolean;
  forceDetection?: boolean;
  preferredProjectName?: string;
}

export interface ProjectContextResponse {
  success: boolean;
  result?: ProjectDetectionResult;
  isolation?: ProjectIsolationValidation;
  error?: string;
  timestamp: Date;
}
