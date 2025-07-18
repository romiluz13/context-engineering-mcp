import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { Memory } from "../../../domain/entities/index.js";
import { MemoryRepository } from "../../../data/protocols/memory-repository.js";

export interface MongoDBListProjectFilesRequest {
  projectName: string;
}

export interface FileInfo {
  fileName: string;
  lastModified: string;
  wordCount: number;
  tags: string[];
}

export type MongoDBListProjectFilesResponse = FileInfo[];

export { Controller, Request, Response, Validator, MemoryRepository };
