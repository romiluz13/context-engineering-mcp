import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { Memory } from "../../../domain/entities/index.js";
import { MemoryRepository } from "../../../data/protocols/memory-repository.js";

export interface MongoDBListProjectFilesRequest {
  projectName: string;
}

// Keep FileInfo interface for potential future enhanced tools
export interface FileInfo {
  fileName: string;
  lastModified: string;
  wordCount: number;
  tags: string[];
}

// Core tool returns simple string array for backward compatibility
export type MongoDBListProjectFilesResponse = string[];

export { Controller, Request, Response, Validator, MemoryRepository };
