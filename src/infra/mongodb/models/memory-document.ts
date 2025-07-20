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
  // ENHANCED: AI-optimized metadata for superior code generation context
  memoryType?: MemoryType;
  metadata?: {
    aiContextType: string;
    codeRelevance: number;
    technicalDepth: number;
    implementationDetails: string[];
    errorPatterns: string[];
    architecturalInsights: string[];
    relatedMemories: string[];
  };
  // Backward compatibility
  relationships?: MemoryRelationships;
  templateVersion?: string;
  structuredData?: Record<string, any>;
}

export interface MemorySearchDocument extends MemoryDocument {
  score?: number;
}
