import { Memory } from "../entities/index.js";

export interface MemoryStoreParams {
  projectName: string;
  fileName: string;
  content: string;
  tags?: string[];
}

export interface MemoryStoreUseCase {
  store(params: MemoryStoreParams): Promise<Memory>;
}
