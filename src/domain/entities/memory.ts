export interface Memory {
  id?: string;
  projectName: string;
  fileName: string;
  content: string;
  tags: string[];
  lastModified: Date;
  wordCount: number;
  // Atlas only - vector embeddings
  contentVector?: number[];
  summary?: string;
}

export interface MemorySearchResult extends Memory {
  score?: number;
  relevance?: string;
}

export interface MemorySearchParams {
  query: string;
  projectName?: string;
  tags?: string[];
  limit?: number;
  useSemanticSearch?: boolean;
}
