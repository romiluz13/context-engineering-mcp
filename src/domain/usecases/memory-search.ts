import { MemorySearchResult, MemorySearchParams } from "../entities/index.js";

export interface MemorySearchUseCase {
  search(params: MemorySearchParams): Promise<MemorySearchResult[]>;
}
