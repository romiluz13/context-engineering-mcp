import { MemorySearchResult } from "../entities/index.js";

export interface MemoryDiscoverParams {
  projectName: string;
  fileName: string;
  limit?: number;
}

export interface MemoryDiscoverUseCase {
  discover(params: MemoryDiscoverParams): Promise<MemorySearchResult[]>;
}
