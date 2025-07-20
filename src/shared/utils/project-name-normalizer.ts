/**
 * Project Name Normalization & Path-Based Detection Utility
 *
 * Provides consistent project name normalization and automatic project detection
 * from working directory paths to ensure 100% project isolation.
 *
 * Based on MongoDB best practices: lowercase, hyphen-separated
 * Inspired by alioshr/memory-bank-mcp path-based approach
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import os from 'os';

/**
 * Normalizes a project name to ensure consistency across different sources
 * Follows MongoDB best practices: lowercase, hyphen-separated
 * 
 * @param name - The project name to normalize
 * @returns Normalized project name
 * 
 * @example
 * normalizeProjectName("My Project Name") // "my-project-name"
 * normalizeProjectName("mongodb_memory_bank_mcp") // "mongodb-memory-bank-mcp"
 * normalizeProjectName("MongoDB-Memory-Bank-MCP") // "mongodb-memory-bank-mcp"
 */
export function normalizeProjectName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Project name must be a non-empty string');
  }

  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/_/g, '-') // Convert underscores to hyphens for consistency
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
}

/**
 * Validates that a project name is properly normalized
 * 
 * @param name - The project name to validate
 * @returns True if the name is already normalized
 */
export function isNormalizedProjectName(name: string): boolean {
  try {
    return normalizeProjectName(name) === name;
  } catch {
    return false;
  }
}

/**
 * Normalizes project name with validation
 * Throws descriptive error if normalization fails
 * 
 * @param name - The project name to normalize
 * @returns Normalized project name
 * @throws Error if name is invalid or normalization fails
 */
export function normalizeProjectNameSafe(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid parameter: Project name must be a non-empty string');
  }

  const normalized = normalizeProjectName(name);
  
  if (!normalized) {
    throw new Error(`Invalid parameter: ${name} - Project name cannot be normalized to a valid identifier`);
  }

  return normalized;
}

/**
 * Project Detection Result
 */
export interface ProjectDetectionResult {
  projectName: string;
  detectionMethod: 'git-root' | 'package-name' | 'directory-name';
  confidence: number;
  workingDirectory: string;
  gitRoot?: string;
  packageName?: string;
}

/**
 * Finds the Git repository root directory
 * @param startPath - Starting directory path
 * @returns Git root path or null if not found
 */
function findGitRoot(startPath: string): string | null {
  let currentPath = path.resolve(startPath);

  while (currentPath !== path.dirname(currentPath)) {
    try {
      const gitPath = path.join(currentPath, '.git');
      if (fs.existsSync(gitPath)) {
        return currentPath;
      }
    } catch {
      // Continue searching
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Finds and reads package.json
 * @param startPath - Starting directory path
 * @returns Package name or null if not found
 */
function findPackageName(startPath: string): string | null {
  let currentPath = path.resolve(startPath);

  while (currentPath !== path.dirname(currentPath)) {
    try {
      const packagePath = path.join(currentPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        if (packageJson.name) {
          // Handle scoped packages like @org/package-name
          const cleanName = packageJson.name.split('/').pop() || packageJson.name;
          return cleanName;
        }
      }
    } catch {
      // Continue searching
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Detects project name from working directory using multiple strategies
 * This is the core function that ensures 100% project isolation
 *
 * @param workingDirectory - Current working directory (defaults to process.cwd())
 * @returns Project detection result with normalized name
 */
export function detectProjectFromPath(workingDirectory?: string): ProjectDetectionResult {
  const cwd = workingDirectory || process.cwd();

  // Strategy 1: Git repository root (highest confidence)
  const gitRoot = findGitRoot(cwd);
  if (gitRoot) {
    const gitProjectName = path.basename(gitRoot);
    return {
      projectName: normalizeProjectName(gitProjectName),
      detectionMethod: 'git-root',
      confidence: 95,
      workingDirectory: cwd,
      gitRoot,
      packageName: findPackageName(gitRoot) || undefined
    };
  }

  // Strategy 2: Package.json name (high confidence)
  const packageName = findPackageName(cwd);
  if (packageName) {
    return {
      projectName: normalizeProjectName(packageName),
      detectionMethod: 'package-name',
      confidence: 90,
      workingDirectory: cwd,
      packageName
    };
  }

  // Strategy 3: Directory name (fallback)
  const dirName = path.basename(cwd);
  return {
    projectName: normalizeProjectName(dirName),
    detectionMethod: 'directory-name',
    confidence: 80,
    workingDirectory: cwd
  };
}

/**
 * Gets the current project name automatically from working directory
 * This is the main function used by MCP tools for automatic project detection
 *
 * @param workingDirectory - Optional working directory (defaults to process.cwd())
 * @returns Normalized project name
 */
export function getCurrentProjectName(workingDirectory?: string): string {
  const detection = detectProjectFromPath(workingDirectory);
  return detection.projectName;
}

/**
 * Universal Project Detection System
 * Implements multi-signal detection following MCP patterns and MongoDB best practices
 * Based on research from alioshr/memory-bank-mcp and MongoDB official MCP server
 */

export interface UniversalProjectDetection {
  projectName: string;
  confidence: number;
  detectionMethod: 'git-root' | 'package-name' | 'directory-name' | 'recent-activity' | 'file-markers' | 'smart-default';
  workingDirectory: string;
  signals: ProjectSignal[];
  metadata?: {
    gitRoot?: string;
    packageName?: string;
    recentFiles?: string[];
    projectMarkers?: string[];
  };
}

export interface ProjectSignal {
  type: 'git' | 'package' | 'file-activity' | 'directory-structure' | 'process-activity' | 'content-analysis' | 'smart-default';
  confidence: number;
  projectName: string;
  evidence: string[];
}

/**
 * Universal project detection that works in ANY scenario
 * Following MCP patterns and MongoDB best practices
 *
 * @param workingDirectory - Optional working directory
 * @returns Universal project detection result
 */
export async function detectProjectUniversally(workingDirectory?: string): Promise<UniversalProjectDetection> {
  const cwd = workingDirectory || process.env.MCP_WORKING_DIRECTORY || process.cwd();
  const signals: ProjectSignal[] = [];

  try {
    // Signal 1: Git-based detection (highest confidence)
    const gitSignal = await detectFromGit(cwd);
    if (gitSignal) signals.push(gitSignal);

    // Signal 2: Package file detection (high confidence)
    const packageSignal = await detectFromPackageFiles(cwd);
    if (packageSignal) signals.push(packageSignal);

    // Signal 3: Recent file activity (medium confidence)
    const activitySignal = await detectFromFileActivity(cwd);
    if (activitySignal) signals.push(activitySignal);

    // Signal 4: Directory structure analysis (medium confidence)
    const structureSignal = await detectFromDirectoryStructure(cwd);
    if (structureSignal) signals.push(structureSignal);

    // Signal 5: Project markers (low-medium confidence)
    const markersSignal = await detectFromProjectMarkers(cwd);
    if (markersSignal) signals.push(markersSignal);

    // Select best signal based on confidence
    const bestSignal = signals.length > 0
      ? signals.reduce((best, current) => current.confidence > best.confidence ? current : best)
      : null;

    // SMART FALLBACK: If no good signals, low confidence, or empty project name, check existing projects
    if (!bestSignal || bestSignal.confidence < 80 || !bestSignal.projectName || bestSignal.projectName.trim() === '') {
      const fallbackResult = await smartProjectFallback(cwd, signals);
      if (fallbackResult) {
        return fallbackResult;
      }

      // If fallback also fails, use smart default
      const defaultSignal = generateSmartDefault(cwd);
      signals.push(defaultSignal);
      return {
        projectName: defaultSignal.projectName,
        confidence: defaultSignal.confidence,
        detectionMethod: 'smart-default',
        workingDirectory: cwd,
        signals
      };
    }

    return {
      projectName: bestSignal.projectName,
      confidence: bestSignal.confidence,
      detectionMethod: bestSignal.type === 'git' ? 'git-root' :
                      bestSignal.type === 'package' ? 'package-name' :
                      bestSignal.type === 'file-activity' ? 'recent-activity' :
                      bestSignal.type === 'directory-structure' ? 'directory-name' :
                      bestSignal.type === 'smart-default' ? 'smart-default' :
                      'file-markers',
      workingDirectory: cwd,
      signals
    };

  } catch (error) {
    // Fallback to smart default on any error
    const defaultSignal = generateSmartDefault(cwd);
    return {
      projectName: defaultSignal.projectName,
      confidence: defaultSignal.confidence,
      detectionMethod: 'smart-default',
      workingDirectory: cwd,
      signals: [defaultSignal]
    };
  }
}

/**
 * Git-based project detection
 * Following MongoDB MCP patterns for robust detection
 */
async function detectFromGit(workingDirectory: string): Promise<ProjectSignal | null> {
  try {
    // Try to find git root using git command
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd: workingDirectory,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    if (gitRoot && fs.existsSync(gitRoot)) {
      const projectName = normalizeProjectName(path.basename(gitRoot));
      return {
        type: 'git',
        confidence: 95,
        projectName,
        evidence: [`Git repository root: ${gitRoot}`]
      };
    }
  } catch (error) {
    // Git not available or not in a git repository
  }

  return null;
}

/**
 * Package file detection
 * Supports multiple package managers following MCP patterns
 */
async function detectFromPackageFiles(workingDirectory: string): Promise<ProjectSignal | null> {
  const packageMarkers = [
    { file: 'package.json', confidence: 95, parser: parsePackageJson },
    { file: 'pyproject.toml', confidence: 90, parser: parsePyprojectToml },
    { file: 'Cargo.toml', confidence: 90, parser: parseCargoToml },
    { file: 'go.mod', confidence: 90, parser: parseGoMod },
    { file: 'composer.json', confidence: 85, parser: parseComposerJson },
    { file: 'requirements.txt', confidence: 70, parser: null }
  ];

  let currentPath = path.resolve(workingDirectory);

  while (currentPath !== path.dirname(currentPath)) {
    for (const marker of packageMarkers) {
      const filePath = path.join(currentPath, marker.file);

      if (fs.existsSync(filePath)) {
        let projectName = path.basename(currentPath);

        // Try to extract name from package file
        if (marker.parser) {
          try {
            const extractedName = marker.parser(filePath);
            if (extractedName) {
              projectName = extractedName;
            }
          } catch (error) {
            // Use directory name as fallback
          }
        }

        return {
          type: 'package',
          confidence: marker.confidence,
          projectName: normalizeProjectName(projectName),
          evidence: [`Package file: ${marker.file}`, `Path: ${filePath}`]
        };
      }
    }

    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Package file parsers
 * Following MongoDB MCP patterns for robust parsing
 */
function parsePackageJson(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(content);
    if (packageJson.name) {
      // Handle scoped packages like @org/package-name
      return packageJson.name.split('/').pop() || packageJson.name;
    }
  } catch (error) {
    // Invalid JSON or file read error
  }
  return null;
}

function parsePyprojectToml(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
    return nameMatch ? nameMatch[1] : null;
  } catch (error) {
    return null;
  }
}

function parseCargoToml(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
    return nameMatch ? nameMatch[1] : null;
  } catch (error) {
    return null;
  }
}

function parseGoMod(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const moduleMatch = content.match(/module\s+([^\s]+)/);
    if (moduleMatch) {
      // Extract last part of module path
      return moduleMatch[1].split('/').pop() || moduleMatch[1];
    }
  } catch (error) {
    return null;
  }
  return null;
}

function parseComposerJson(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const composerJson = JSON.parse(content);
    if (composerJson.name) {
      // Handle vendor/package format
      return composerJson.name.split('/').pop() || composerJson.name;
    }
  } catch (error) {
    return null;
  }
  return null;
}

/**
 * File activity detection
 * Detects projects based on recent file modifications
 */
async function detectFromFileActivity(workingDirectory: string): Promise<ProjectSignal | null> {
  try {
    const stats = fs.statSync(workingDirectory);
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000); // 24 hours ago

    // Check if directory has recent activity
    if (stats.mtime.getTime() > dayAgo) {
      const projectName = normalizeProjectName(path.basename(workingDirectory));
      return {
        type: 'file-activity',
        confidence: 75,
        projectName,
        evidence: [`Recent activity in directory: ${workingDirectory}`, `Modified: ${stats.mtime.toISOString()}`]
      };
    }
  } catch (error) {
    // Directory doesn't exist or permission error
  }

  return null;
}

/**
 * Directory structure analysis
 * Analyzes directory structure for project indicators
 */
async function detectFromDirectoryStructure(workingDirectory: string): Promise<ProjectSignal | null> {
  try {
    if (!fs.existsSync(workingDirectory)) {
      return null;
    }

    const files = fs.readdirSync(workingDirectory);
    const projectIndicators = [
      'src', 'lib', 'app', 'components', 'pages', 'routes',
      'test', 'tests', '__tests__', 'spec',
      'docs', 'documentation',
      'config', 'configs',
      'public', 'static', 'assets',
      'build', 'dist', 'out',
      'node_modules', 'vendor', 'target'
    ];

    const foundIndicators = files.filter(file =>
      projectIndicators.includes(file.toLowerCase())
    );

    if (foundIndicators.length >= 2) {
      const projectName = normalizeProjectName(path.basename(workingDirectory));
      return {
        type: 'directory-structure',
        confidence: 70,
        projectName,
        evidence: [`Project structure indicators: ${foundIndicators.join(', ')}`]
      };
    }
  } catch (error) {
    // Directory read error
  }

  return null;
}

/**
 * Project markers detection
 * Looks for common project files
 */
async function detectFromProjectMarkers(workingDirectory: string): Promise<ProjectSignal | null> {
  const markers = [
    'README.md', 'README.txt', 'README',
    'LICENSE', 'LICENSE.txt', 'LICENSE.md',
    'Dockerfile', 'docker-compose.yml',
    '.gitignore', '.gitattributes',
    'Makefile', 'makefile',
    '.vscode', '.idea',
    'tsconfig.json', 'jsconfig.json',
    '.eslintrc', '.prettierrc'
  ];

  try {
    const files = fs.readdirSync(workingDirectory);
    const foundMarkers = markers.filter(marker => files.includes(marker));

    if (foundMarkers.length >= 1) {
      const projectName = normalizeProjectName(path.basename(workingDirectory));
      return {
        type: 'content-analysis',
        confidence: 65,
        projectName,
        evidence: [`Project markers found: ${foundMarkers.join(', ')}`]
      };
    }
  } catch (error) {
    // Directory read error
  }

  return null;
}

/**
 * Smart default generator
 * Following MongoDB MCP patterns for robust fallbacks
 */
function generateSmartDefault(workingDirectory: string): ProjectSignal {
  try {
    // Strategy 1: Use directory name if it looks like a project
    const dirName = path.basename(workingDirectory);
    if (dirName && dirName !== '/' && dirName !== '.' && dirName.length > 1) {
      return {
        type: 'smart-default',
        confidence: 60,
        projectName: normalizeProjectName(dirName),
        evidence: [`Directory name: ${dirName}`]
      };
    }

    // Strategy 2: Generate unique name based on path and timestamp
    const pathHash = workingDirectory.split('/').slice(-2).join('-');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const username = os.userInfo().username || 'user';

    const fallbackName = `project-${pathHash}-${timestamp}-${username}`;

    return {
      type: 'smart-default',
      confidence: 50,
      projectName: normalizeProjectName(fallbackName),
      evidence: [`Generated from path: ${workingDirectory}`, `Timestamp: ${timestamp}`]
    };

  } catch (error) {
    // Ultimate fallback
    const timestamp = Date.now().toString(36);
    return {
      type: 'smart-default',
      confidence: 40,
      projectName: `project-${timestamp}`,
      evidence: [`Emergency fallback: ${timestamp}`]
    };
  }
}

/**
 * Smart fallback when normal project detection fails
 * Checks existing projects in MongoDB and provides intelligent selection
 */
async function smartProjectFallback(workingDirectory: string, existingSignals: ProjectSignal[]): Promise<UniversalProjectDetection | null> {
  try {
    // Import here to avoid circular dependencies
    const { MongoDBProjectRepository } = await import('../../infra/mongodb/repositories/mongodb-project-repository.js');
    const projectRepository = new MongoDBProjectRepository();

    const existingProjects = await projectRepository.listProjects();

    if (existingProjects.length === 0) {
      // No existing projects - let normal fallback handle this
      return null;
    }

    if (existingProjects.length === 1) {
      // Only one project exists - use it automatically with high confidence
      const projectName = existingProjects[0];
      const fallbackSignal: ProjectSignal = {
        type: 'smart-default',
        confidence: 90,
        projectName,
        evidence: [
          'Only one project exists in memory bank',
          `Auto-selected: ${projectName}`,
          `Working directory: ${workingDirectory}`
        ]
      };

      return {
        projectName,
        confidence: 90,
        detectionMethod: 'smart-default',
        workingDirectory,
        signals: [...existingSignals, fallbackSignal],
        metadata: {
          projectMarkers: ['single-project-auto-selection']
        }
      };
    }

    // Multiple projects exist - need AI-assisted selection
    // For now, use most recently accessed project with medium confidence
    const mostRecentProject = existingProjects[0]; // Already sorted by lastAccessed DESC
    const fallbackSignal: ProjectSignal = {
      type: 'smart-default',
      confidence: 75,
      projectName: mostRecentProject,
      evidence: [
        `Multiple projects found: ${existingProjects.length}`,
        `Using most recent: ${mostRecentProject}`,
        'Consider implementing AI-assisted selection for better accuracy'
      ]
    };

    return {
      projectName: mostRecentProject,
      confidence: 75,
      detectionMethod: 'smart-default',
      workingDirectory,
      signals: [...existingSignals, fallbackSignal],
      metadata: {
        projectMarkers: ['multi-project-recent-selection'],
        recentFiles: existingProjects
      }
    };

  } catch (error) {
    console.error('[SMART-FALLBACK] Error accessing existing projects:', error);
    return null;
  }
}

/**
 * Enhanced project detection for MCP environments
 * Combines universal detection with MCP-specific context
 */
export async function detectProjectForMCP(mcpContext?: any): Promise<string> {
  try {
    // Check for MCP-provided working directory
    const mcpWorkingDir = process.env.MCP_WORKING_DIRECTORY ||
                         mcpContext?.workingDirectory ||
                         process.cwd();

    const detection = await detectProjectUniversally(mcpWorkingDir);

    // Log detection for debugging (following MongoDB MCP patterns)
    console.log(`[UNIVERSAL-PROJECT-DETECTION] Method: ${detection.detectionMethod}, Confidence: ${detection.confidence}%, Project: "${detection.projectName}"`);

    return detection.projectName;

  } catch (error) {
    console.error('[UNIVERSAL-PROJECT-DETECTION] Error:', error);

    // Emergency fallback
    const fallback = `project-${Date.now().toString(36)}`;
    console.log(`[UNIVERSAL-PROJECT-DETECTION] Emergency fallback: "${fallback}"`);

    return fallback;
  }
}
