/**
 * Session State Management
 * Fixes the "where am I?" confusion problem
 */

import { MCPError } from '../errors/mcp-error.js';

export interface Operation {
  name: string;
  parameters: any;
  timestamp: Date;
  success: boolean;
  result?: any;
  error?: MCPError;
}

export interface NextAction {
  command: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  automated?: boolean;
  parameters?: any;
}

export interface SessionState {
  // Project state
  activeProject: string | null;
  projectExists: boolean;
  projectStatus: 'connected' | 'disconnected' | 'unknown';
  
  // Operation history
  operationHistory: Operation[];
  lastOperation: Operation | null;
  lastError: MCPError | null;
  
  // Recovery state
  recoveryMode: boolean;
  pendingActions: NextAction[];
  
  // Context
  workingDirectory: string;
  detectedProjectName: string | null;
  availableProjects: string[];
  
  // Session info
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
}

export class MemoryBankSession {
  private static instance: MemoryBankSession;
  private state: SessionState;

  private constructor() {
    this.state = this.createInitialState();
  }

  static getInstance(): MemoryBankSession {
    if (!MemoryBankSession.instance) {
      MemoryBankSession.instance = new MemoryBankSession();
    }
    return MemoryBankSession.instance;
  }

  private createInitialState(): SessionState {
    return {
      activeProject: null,
      projectExists: false,
      projectStatus: 'unknown',
      operationHistory: [],
      lastOperation: null,
      lastError: null,
      recoveryMode: false,
      pendingActions: [],
      workingDirectory: process.cwd(),
      detectedProjectName: null,
      availableProjects: [],
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Update session state after operation
   */
  updateAfterOperation(operation: Operation): void {
    this.state.operationHistory.push(operation);
    this.state.lastOperation = operation;
    this.state.lastActivity = new Date();

    // Update project state based on operation
    if (operation.name === 'create_project' && operation.success) {
      this.state.activeProject = operation.result?.projectName || operation.parameters?.projectName;
      this.state.projectExists = true;
      this.state.projectStatus = 'connected';
      this.state.recoveryMode = false;
    }

    if (operation.name === 'connect_to_project' && operation.success) {
      this.state.activeProject = operation.parameters?.projectName;
      this.state.projectExists = true;
      this.state.projectStatus = 'connected';
      this.state.recoveryMode = false;
    }

    if (operation.name === 'list_projects' && operation.success) {
      this.state.availableProjects = operation.result?.projects || [];
    }

    // Handle errors
    if (!operation.success && operation.error) {
      this.state.lastError = operation.error;
      this.state.recoveryMode = true;
      this.updatePendingActions(operation.error);
    }

    // Keep history manageable
    if (this.state.operationHistory.length > 50) {
      this.state.operationHistory = this.state.operationHistory.slice(-25);
    }
  }

  /**
   * Update pending actions based on error
   */
  private updatePendingActions(error: MCPError): void {
    this.state.pendingActions = error.recoveryOptions.map((option: any) => ({
      command: option.action,
      description: option.description,
      priority: 'high' as const,
      automated: option.automated,
      parameters: option.parameters
    }));
  }

  /**
   * Get suggested next actions
   */
  getSuggestedNextActions(): NextAction[] {
    const actions: NextAction[] = [];

    // If in recovery mode, prioritize recovery actions
    if (this.state.recoveryMode && this.state.pendingActions.length > 0) {
      return this.state.pendingActions;
    }

    // Based on current state
    if (!this.state.activeProject) {
      actions.push(
        { command: 'list_projects', description: 'See available projects', priority: 'high' },
        { command: 'create_project', description: 'Create a new project', priority: 'high' },
        { command: 'detect_project_context_secure', description: 'Auto-detect project', priority: 'medium' }
      );
    } else if (this.state.projectStatus === 'connected') {
      actions.push(
        { command: 'list_project_files', description: 'View project files', priority: 'medium' },
        { command: 'memory_search', description: 'Search project content', priority: 'medium' },
        { command: 'memory_bank_update', description: 'Add content to project', priority: 'low' }
      );
    }

    return actions;
  }

  /**
   * Get status message
   */
  getStatusMessage(): string {
    if (this.state.recoveryMode && this.state.lastError) {
      return `⚠️ Recovery needed: ${this.state.lastError.message}`;
    }

    if (this.state.activeProject) {
      return `✅ Connected to project: ${this.state.activeProject}`;
    }

    if (this.state.availableProjects.length > 0) {
      return `📋 Found ${this.state.availableProjects.length} available projects`;
    }

    return `🚀 Ready to start - no active project`;
  }

  /**
   * Clear recovery mode
   */
  clearRecoveryMode(): void {
    this.state.recoveryMode = false;
    this.state.lastError = null;
    this.state.pendingActions = [];
  }

  /**
   * Set active project
   */
  setActiveProject(projectName: string): void {
    this.state.activeProject = projectName;
    this.state.projectExists = true;
    this.state.projectStatus = 'connected';
    this.state.recoveryMode = false;
  }

  /**
   * Reset session
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Get session summary for debugging
   */
  getSummary(): any {
    return {
      sessionId: this.state.sessionId,
      activeProject: this.state.activeProject,
      projectStatus: this.state.projectStatus,
      operationCount: this.state.operationHistory.length,
      lastOperation: this.state.lastOperation?.name,
      recoveryMode: this.state.recoveryMode,
      statusMessage: this.getStatusMessage(),
      suggestedActions: this.getSuggestedNextActions().slice(0, 3)
    };
  }
}
