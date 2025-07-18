import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { MemoryLoadUseCase } from "../../../domain/usecases/memory-load.js";
import { Memory } from "../../../domain/entities/index.js";

export interface MemoryLoadRequest {
  projectName: string;
  fileName: string;
}

export type MemoryLoadResponse = Memory | null;

export { Controller, Request, Response, Validator, MemoryLoadUseCase };
