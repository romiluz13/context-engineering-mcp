import { ObjectId } from 'mongodb';
import { MemoryType, MemoryRelationships } from '../../../domain/entities/memory.js';

export interface MemoryDocument {
  _id?: ObjectId;
  projectName: string;
  fileName: string;
  content: string;
  tags: string[];
  lastModified: Date;
  wordCount: number;
  // Atlas only fields
  contentVector?: number[];
  summary?: string;
  // NEW: Structured template support (backward compatible)
  memoryType?: MemoryType;
  templateVersion?: string;
  relationships?: MemoryRelationships;
  structuredData?: Record<string, any>;
}

export interface MemorySearchDocument extends MemoryDocument {
  score?: number;
}
