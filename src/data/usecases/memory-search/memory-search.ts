import { MemorySearchResult, MemorySearchParams } from "../../../domain/entities/index.js";
import { MemorySearchUseCase } from "../../../domain/usecases/memory-search.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";

export class MemorySearch implements MemorySearchUseCase {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async search(params: MemorySearchParams): Promise<MemorySearchResult[]> {
    return this.memoryRepository.search(params);
  }
}
