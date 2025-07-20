import { MemoryType, StructuredMemory, MemoryValidationResult, MemoryRelationships } from '../entities/memory.js';
import { getTemplate, TEMPLATE_HIERARCHY } from '../entities/memory-templates.js';

/**
 * Use case for storing structured memories with template validation
 * Extends existing memory storage with structured template support
 * Designed to work in perfect harmony with existing universal project detection
 */
export interface MemoryStoreStructured {
  execute(params: MemoryStoreStructuredParams): Promise<MemoryStoreStructuredResult>;
}

export interface MemoryStoreStructuredParams {
  fileName: string;
  content: string;
  memoryType: MemoryType;
  projectName?: string;
  forceDetection?: boolean;
  validateIsolation?: boolean;
  workingDirectory?: string;
  preferredProjectName?: string;
}

export interface MemoryStoreStructuredResult {
  memory: StructuredMemory;
  validation: MemoryValidationResult;
  projectContext: {
    projectName: string;
    detectionMethod: string;
    confidence: number;
    isNewProject: boolean;
  };
}
