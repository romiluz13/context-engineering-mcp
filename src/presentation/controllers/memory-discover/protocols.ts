import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { MemoryDiscoverUseCase } from "../../../domain/usecases/memory-discover.js";
import { MemorySearchResult } from "../../../domain/entities/index.js";

export interface MemoryDiscoverRequest {
  projectName: string;
  fileName: string;
  limit?: number;
}

export type MemoryDiscoverResponse = MemorySearchResult[];

export { Controller, Request, Response, Validator, MemoryDiscoverUseCase };
