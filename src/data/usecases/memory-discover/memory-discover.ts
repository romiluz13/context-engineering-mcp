import { MemorySearchResult } from "../../../domain/entities/index.js";
import { MemoryDiscoverParams, MemoryDiscoverUseCase } from "../../../domain/usecases/memory-discover.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";

export class MemoryDiscover implements MemoryDiscoverUseCase {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async discover(params: MemoryDiscoverParams): Promise<MemorySearchResult[]> {
    const { projectName, fileName, limit = 5 } = params;
    return this.memoryRepository.findRelated(projectName, fileName, limit);
  }
}
