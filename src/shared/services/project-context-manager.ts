/**
 * Master Project Context Manager
 * Single source of truth for project detection and consistency
 * Solves the critical project mixing and inconsistency issues
 */

import { normalizeProjectName, detectProjectUniversally, UniversalProjectDetection } from '../utils/project-name-normalizer.js';

export interface ProjectContext {
  projectName: string;
  workingDirectory: string;
  detectionMethod: string;
  confidence: number;
  timestamp: Date;
  sessionId: string;
}

export interface ProjectContextPersistence {
  projectName: string;
  workingDirectory: string;
  detectionMethod: string;
  confidence: number;
  timestamp: Date;
  sessionId: string;
  lastAccessed: Date;
}

/**
 * Master Project Context Manager
 * Ensures 100% project consistency across all operations
 */
export class ProjectContextManager {
  private static instance: ProjectContextManager;
  private currentContext: ProjectContext | null = null;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): ProjectContextManager {
    if (!ProjectContextManager.instance) {
      ProjectContextManager.instance = new ProjectContextManager();
    }
    return ProjectContextManager.instance;
  }

  /**
   * Get current project context with automatic restoration
   * This is the SINGLE function used by ALL tools
   */
  public async getCurrentProjectContext(workingDirectory?: string): Promise<ProjectContext> {
    // If we have valid current context, return it
    if (this.currentContext && this.isContextValid(this.currentContext)) {
      await this.updateLastAccessed(this.currentContext.projectName);
      return this.currentContext;
    }

    // Try to restore from MongoDB persistence
    const restoredContext = await this.restoreFromPersistence(workingDirectory);
    if (restoredContext) {
      this.currentContext = restoredContext;
      console.log(`[PROJECT-CONTEXT] Restored from persistence: ${restoredContext.projectName}`);
      return restoredContext;
    }

    // Detect new project context
    const detectedContext = await this.detectProjectContext(workingDirectory);
    this.currentContext = detectedContext;
    
    // Persist for future sessions
    await this.persistContext(detectedContext);
    
    console.log(`[PROJECT-CONTEXT] New context detected: ${detectedContext.projectName}`);
    return detectedContext;
  }

  /**
   * Explicitly set project context (used by detect_project_context_secure)
   */
  public async setProjectContext(projectName: string, workingDirectory: string, detectionMethod: string = 'explicit'): Promise<void> {
    const context: ProjectContext = {
      projectName: normalizeProjectName(projectName),
      workingDirectory,
      detectionMethod,
      confidence: 100,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.currentContext = context;
    await this.persistContext(context);
    
    console.log(`[PROJECT-CONTEXT] Explicitly set: ${context.projectName}`);
  }

  /**
   * Validate that operation is using correct project
   */
  public async validateProjectContext(expectedProject?: string): Promise<boolean> {
    const currentContext = await this.getCurrentProjectContext();
    
    if (expectedProject && expectedProject !== currentContext.projectName) {
      console.error(`[PROJECT-CONTEXT] Validation failed: expected ${expectedProject}, got ${currentContext.projectName}`);
      return false;
    }

    return true;
  }

  /**
   * Get project name for memory operations
   */
  public async getProjectName(workingDirectory?: string): Promise<string> {
    const context = await this.getCurrentProjectContext(workingDirectory);
    return context.projectName;
  }

  /**
   * Clear context (for testing or explicit reset)
   */
  public clearContext(): void {
    this.currentContext = null;
    console.log(`[PROJECT-CONTEXT] Context cleared`);
  }

  // Private implementation methods

  private async detectProjectContext(workingDirectory?: string): Promise<ProjectContext> {
    const detection = await detectProjectUniversally(workingDirectory);
    
    return {
      projectName: detection.projectName,
      workingDirectory: detection.workingDirectory,
      detectionMethod: detection.detectionMethod,
      confidence: detection.confidence,
      timestamp: new Date(),
      sessionId: this.sessionId
    };
  }

  private isContextValid(context: ProjectContext): boolean {
    // Context is valid if it's from current session and recent
    const isCurrentSession = context.sessionId === this.sessionId;
    const isRecent = Date.now() - context.timestamp.getTime() < 24 * 60 * 60 * 1000; // 24 hours
    
    return isCurrentSession && isRecent;
  }

  private async persistContext(context: ProjectContext): Promise<void> {
    try {
      const { MongoDBConnection } = await import('../../infra/mongodb/connection/mongodb-connection.js');
      const db = await MongoDBConnection.getInstance().getDatabase();
      const collection = db.collection('project_context');

      const persistenceDoc: ProjectContextPersistence = {
        ...context,
        lastAccessed: new Date()
      };

      await collection.replaceOne(
        { sessionId: this.sessionId },
        persistenceDoc,
        { upsert: true }
      );

      console.log(`[PROJECT-CONTEXT] Persisted: ${context.projectName}`);
    } catch (error) {
      console.warn(`[PROJECT-CONTEXT] Failed to persist: ${error}`);
    }
  }

  private async restoreFromPersistence(workingDirectory?: string): Promise<ProjectContext | null> {
    try {
      const { MongoDBConnection } = await import('../../infra/mongodb/connection/mongodb-connection.js');
      const db = await MongoDBConnection.getInstance().getDatabase();
      const collection = db.collection('project_context');

      // Try to find context for current session first
      let doc = await collection.findOne({ sessionId: this.sessionId });

      // If no session context, try to find recent context for working directory
      if (!doc && workingDirectory) {
        doc = await collection.findOne(
          { workingDirectory },
          { sort: { lastAccessed: -1 } }
        );
      }

      if (!doc) {
        return null;
      }

      // Check if context is still valid (not too old)
      const age = Date.now() - new Date(doc.lastAccessed).getTime();
      if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
        console.log(`[PROJECT-CONTEXT] Persisted context too old, ignoring`);
        return null;
      }

      return {
        projectName: doc.projectName,
        workingDirectory: doc.workingDirectory,
        detectionMethod: doc.detectionMethod,
        confidence: doc.confidence,
        timestamp: new Date(doc.timestamp),
        sessionId: this.sessionId // Update to current session
      };
    } catch (error) {
      console.warn(`[PROJECT-CONTEXT] Failed to restore: ${error}`);
      return null;
    }
  }

  private async updateLastAccessed(projectName: string): Promise<void> {
    try {
      const { MongoDBConnection } = await import('../../infra/mongodb/connection/mongodb-connection.js');
      const db = await MongoDBConnection.getInstance().getDatabase();
      const collection = db.collection('project_context');

      await collection.updateOne(
        { projectName, sessionId: this.sessionId },
        { $set: { lastAccessed: new Date() } }
      );
    } catch (error) {
      // Non-critical, just log
      console.warn(`[PROJECT-CONTEXT] Failed to update last accessed: ${error}`);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Convenience function for getting project name in MCP tools
 * This replaces all the different detection functions
 */
export async function getProjectName(workingDirectory?: string): Promise<string> {
  const manager = ProjectContextManager.getInstance();
  return manager.getProjectName(workingDirectory);
}

/**
 * Convenience function for setting project context
 */
export async function setProjectContext(projectName: string, workingDirectory: string): Promise<void> {
  const manager = ProjectContextManager.getInstance();
  return manager.setProjectContext(projectName, workingDirectory);
}

/**
 * Convenience function for validating project context
 */
export async function validateProjectContext(expectedProject?: string): Promise<boolean> {
  const manager = ProjectContextManager.getInstance();
  return manager.validateProjectContext(expectedProject);
}
