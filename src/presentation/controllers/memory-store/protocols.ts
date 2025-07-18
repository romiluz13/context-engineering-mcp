import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { MemoryStoreUseCase } from "../../../domain/usecases/memory-store.js";

export interface MemoryStoreRequest {
  projectName: string;
  fileName: string;
  content: string;
  tags?: string[];
}

export type MemoryStoreResponse = string;

export { Controller, Request, Response, Validator, MemoryStoreUseCase };
