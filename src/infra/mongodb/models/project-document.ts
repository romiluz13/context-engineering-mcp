import { ObjectId } from 'mongodb';

export interface ProjectDocument {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  lastAccessed: Date;
  memoryCount: number;
  tags: string[];
}
