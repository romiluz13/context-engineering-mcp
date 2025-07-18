export interface Project {
  name: string;
  description?: string;
  createdAt: Date;
  lastAccessed: Date;
  memoryCount: number;
  tags: string[];
}

// Keep backward compatibility
export type ProjectName = string;
