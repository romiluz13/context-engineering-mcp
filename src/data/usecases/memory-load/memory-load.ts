import { Memory } from "../../../domain/entities/index.js";
import { MemoryLoadParams, MemoryLoadUseCase } from "../../../domain/usecases/memory-load.js";
import { MemoryRepository } from "../../protocols/memory-repository.js";

export class MemoryLoad implements MemoryLoadUseCase {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async load(params: MemoryLoadParams): Promise<Memory | null> {
    const { projectName, fileName } = params;
    return this.memoryRepository.load(projectName, fileName);
  }
}
