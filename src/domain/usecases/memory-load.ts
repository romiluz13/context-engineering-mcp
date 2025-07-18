import { Memory } from "../entities/index.js";

export interface MemoryLoadParams {
  projectName: string;
  fileName: string;
}

export interface MemoryLoadUseCase {
  load(params: MemoryLoadParams): Promise<Memory | null>;
}
