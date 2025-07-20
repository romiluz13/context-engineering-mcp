import { Memory, MemorySearchResult, MemorySearchParams, StructuredMemory, MemoryType, MemoryValidationResult } from "../../domain/entities/index.js";

export interface MemoryRepository {
  // Core CRUD operations
  store(memory: Memory): Promise<Memory>;
  load(projectName: string, fileName: string): Promise<Memory | null>;
  update(projectName: string, fileName: string, content: string): Promise<Memory | null>;
  delete(projectName: string, fileName: string): Promise<boolean>;
  
  // List operations
  listByProject(projectName: string): Promise<Memory[]>;
  listAll(): Promise<Memory[]>;
  findByFileName(projectName: string, fileName: string): Promise<Memory | null>;
  
  // Search operations
  search(params: MemorySearchParams): Promise<MemorySearchResult[]>;
  findRelated(projectName: string, fileName: string, limit?: number): Promise<MemorySearchResult[]>;
  
  // Analytics
  getProjectStats(projectName: string): Promise<{
    totalMemories: number;
    totalWords: number;
    commonTags: string[];
    lastActivity: Date;
  }>;

  // NEW: Structured template methods (backward compatible extensions)
  storeStructured(memory: StructuredMemory): Promise<Memory>;
  searchByType(memoryType: MemoryType, projectName: string, limit?: number): Promise<Memory[]>;
  getRelatedMemories(fileName: string, projectName: string, limit?: number): Promise<MemorySearchResult[]>;
  validateTemplate(content: string, memoryType: MemoryType, fileName: string): Promise<MemoryValidationResult>;
  generateTemplateContent(memoryType: MemoryType, projectName?: string): string;
  getMemoriesByHierarchy(projectName: string, level: number): Promise<Memory[]>;
  getTemplateStats(projectName: string): Promise<Record<MemoryType, number>>;
}
