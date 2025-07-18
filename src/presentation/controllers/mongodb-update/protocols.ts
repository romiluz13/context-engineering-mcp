import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { MemoryRepository } from "../../../data/protocols/memory-repository.js";

export interface MongoDBUpdateRequest {
  projectName: string;
  fileName: string;
  content: string;
}

export type MongoDBUpdateResponse = string;

export { Controller, Request, Response, Validator, MemoryRepository };
