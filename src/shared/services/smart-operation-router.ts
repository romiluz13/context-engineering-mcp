/**
 * Smart Operation Router
 * Fixes the project setup confusion and operation inconsistencies
 */

import { MemoryBankSession, NextAction } from '../state/session-state.js';
import { MCPErrorHandler } from '../errors/mcp-error.js';

export interface OperationResult {
  success: boolean;
  result?: any;
  error?: any;
  sessionState: any;
  nextActions: NextAction[];
  statusMessage: string;
  recoveryOptions?: any[];
}

export interface SmartOperationContext {
  intent: string;
  parameters: any;
  workingDirectory?: string;
}

export class SmartOperationRouter {
  private session: MemoryBankSession;

  constructor() {
    this.session = MemoryBankSession.getInstance();
  }

  /**
   * Main entry point for smart operations
   */
  async executeSmartOperation(context: SmartOperationContext): Promise<OperationResult> {
    const startTime = new Date();
    
    try {
      let result: any;

      switch (context.intent) {
        case 'setup_project':
          result = await this.smartProjectSetup(context);
          break;
        case 'save_content':
          result = await this.smartContentSave(context);
          break;
        case 'explore_project':
          result = await this.smartProjectExplore(context);
          break;
        case 'connect_project':
          result = await this.smartProjectConnect(context);
          break;
        default:
          throw new Error(`Unknown intent: ${context.intent}`);
      }

      // Record successful operation
      this.session.updateAfterOperation({
        name: context.intent,
        parameters: context.parameters,
        timestamp: startTime,
        success: true,
        result
      });

      return {
        success: true,
        result,
        sessionState: this.session.getState(),
        nextActions: this.session.getSuggestedNextActions(),
        statusMessage: this.session.getStatusMessage()
      };

    } catch (error) {
      const mcpError = MCPErrorHandler.formatError(error, context);
      
      // Record failed operation
      this.session.updateAfterOperation({
        name: context.intent,
        parameters: context.parameters,
        timestamp: startTime,
        success: false,
        error: mcpError
      });

      return {
        success: false,
        error: mcpError,
        sessionState: this.session.getState(),
        nextActions: this.session.getSuggestedNextActions(),
        statusMessage: this.session.getStatusMessage(),
        recoveryOptions: mcpError.recoveryOptions
      };
    }
  }

  /**
   * Smart project setup - handles all project creation/connection scenarios
   */
  private async smartProjectSetup(context: SmartOperationContext): Promise<any> {
    const { parameters } = context;
    
    // Step 1: Check if project already exists
    const existingProjects = await this.findSimilarProjects(parameters.projectName);
    
    if (existingProjects.length > 0) {
      // Project exists - offer options
      return {
        projectExists: true,
        existingProjects,
        options: [
          {
            action: 'connect',
            description: `Connect to existing project: ${existingProjects[0]}`,
            parameters: { projectName: existingProjects[0] }
          },
          {
            action: 'create_new',
            description: 'Create a new project with different name',
            parameters: { projectName: `${parameters.projectName}-new` }
          },
          {
            action: 'merge',
            description: 'Merge with existing project',
            parameters: { projectName: existingProjects[0], merge: true }
          }
        ],
        message: `Found existing project(s): ${existingProjects.join(', ')}. What would you like to do?`
      };
    }

    // Step 2: Auto-detect project context
    const detection = await this.detectProjectContext(context.workingDirectory);
    
    // Step 3: Create new project with smart naming
    const finalProjectName = parameters.projectName || detection.suggestedName || this.generateProjectName();
    
    const result = await this.createNewProject(finalProjectName, {
      description: parameters.description || detection.description,
      workingDirectory: context.workingDirectory || detection.workingDirectory
    });

    this.session.setActiveProject(finalProjectName);
    
    return {
      projectCreated: true,
      projectName: finalProjectName,
      coreFiles: result.coreFiles,
      message: `Successfully created project: ${finalProjectName}`,
      autoDetected: detection
    };
  }

  /**
   * Smart content save - handles template vs content logic
   */
  private async smartContentSave(context: SmartOperationContext): Promise<any> {
    const { parameters } = context;
    const { fileName, content } = parameters;

    // Ensure we have an active project
    const currentState = this.session.getState();
    if (!currentState.activeProject) {
      throw new Error('No active project. Please set up a project first.');
    }

    // Check if file exists
    const existingFile = await this.getFile(fileName);
    
    if (!existingFile) {
      // Simple create
      return await this.createFile(fileName, content);
    }

    // Smart handling of existing files
    if (this.isTemplateFile(existingFile)) {
      // Replace template with real content
      return await this.updateFile(fileName, content, { replaceTemplate: true });
    }

    // Intelligent merge for user content
    const mergeResult = await this.intelligentMerge(existingFile.content, content);
    return await this.updateFile(fileName, mergeResult.content, { merged: true });
  }

  /**
   * Smart project exploration
   */
  private async smartProjectExplore(context: SmartOperationContext): Promise<any> {
    const currentState = this.session.getState();
    
    if (!currentState.activeProject) {
      // No active project - show available projects
      const projects = await this.listAllProjects();
      return {
        availableProjects: projects,
        message: 'No active project. Here are available projects:',
        suggestedAction: 'connect_to_project'
      };
    }

    // Active project - show project details
    const files = await this.listProjectFiles(currentState.activeProject);
    const recentActivity = await this.getRecentActivity(currentState.activeProject);
    
    return {
      activeProject: currentState.activeProject,
      files,
      recentActivity,
      message: `Exploring project: ${currentState.activeProject}`,
      fileCount: files.length
    };
  }

  /**
   * Smart project connection
   */
  private async smartProjectConnect(context: SmartOperationContext): Promise<any> {
    const { parameters } = context;
    const { projectName } = parameters;

    // Validate project exists
    const projects = await this.listAllProjects();
    if (!projects.includes(projectName)) {
      throw new Error(`Project '${projectName}' not found. Available projects: ${projects.join(', ')}`);
    }

    // Connect to project
    this.session.setActiveProject(projectName);
    
    // Get project overview
    const files = await this.listProjectFiles(projectName);
    
    return {
      connected: true,
      projectName,
      files,
      message: `Successfully connected to project: ${projectName}`,
      fileCount: files.length
    };
  }

  // Helper methods (these would integrate with existing repository methods)
  private async findSimilarProjects(projectName: string): Promise<string[]> {
    // Implementation would search for similar project names
    return [];
  }

  private async detectProjectContext(workingDirectory?: string): Promise<any> {
    // Implementation would detect project context
    return {
      suggestedName: this.generateProjectName(),
      description: 'Auto-detected project',
      workingDirectory: workingDirectory || process.cwd()
    };
  }

  private generateProjectName(): string {
    const date = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substr(2, 5);
    return `project-${date}-${random}`;
  }

  private async createNewProject(name: string, options: any): Promise<any> {
    // Implementation would create new project
    return {
      projectName: name,
      coreFiles: ['projectbrief.md', 'productContext.md', 'systemPatterns.md', 'techContext.md', 'activeContext.md', 'progress.md']
    };
  }

  private async getFile(fileName: string): Promise<any> {
    // Implementation would get file
    return null;
  }

  private isTemplateFile(file: any): boolean {
    // Implementation would check if file is template
    return file.content.includes('[Brief description of the project]');
  }

  private async createFile(fileName: string, content: string): Promise<any> {
    // Implementation would create file
    return { fileName, created: true };
  }

  private async updateFile(fileName: string, content: string, options: any): Promise<any> {
    // Implementation would update file
    return { fileName, updated: true, options };
  }

  private async intelligentMerge(existingContent: string, newContent: string): Promise<any> {
    // Implementation would merge content intelligently
    return { content: existingContent + '\n\n' + newContent };
  }

  private async listAllProjects(): Promise<string[]> {
    // Implementation would list all projects
    return [];
  }

  private async listProjectFiles(projectName: string): Promise<string[]> {
    // Implementation would list project files
    return [];
  }

  private async getRecentActivity(projectName: string): Promise<any[]> {
    // Implementation would get recent activity
    return [];
  }
}
