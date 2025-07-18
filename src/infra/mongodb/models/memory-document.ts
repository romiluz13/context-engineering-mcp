import { ObjectId } from 'mongodb';

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
}

export interface MemorySearchDocument extends MemoryDocument {
  score?: number;
}
