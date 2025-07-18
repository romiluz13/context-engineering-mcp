import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { MemorySearchUseCase } from "../../../domain/usecases/memory-search.js";
import { MemorySearchResult } from "../../../domain/entities/index.js";

export interface MemorySearchRequest {
  query: string;
  projectName?: string;
  tags?: string[];
  limit?: number;
  useSemanticSearch?: boolean;
}

export type MemorySearchResponse = MemorySearchResult[];

export { Controller, Request, Response, Validator, MemorySearchUseCase };
