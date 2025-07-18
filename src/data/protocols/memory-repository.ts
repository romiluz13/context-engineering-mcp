import { Memory, MemorySearchResult, MemorySearchParams } from "../../domain/entities/index.js";

export interface MemoryRepository {
  // Core CRUD operations
  store(memory: Memory): Promise<Memory>;
  load(projectName: string, fileName: string): Promise<Memory | null>;
  update(projectName: string, fileName: string, content: string): Promise<Memory | null>;
  delete(projectName: string, fileName: string): Promise<boolean>;
  
  // List operations
  listByProject(projectName: string): Promise<Memory[]>;
  listAll(): Promise<Memory[]>;
  
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
}
