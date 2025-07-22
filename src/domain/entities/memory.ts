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
  // Backward compatibility - keep existing relationships field
  relationships?: MemoryRelationships;
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
  // ENHANCED: AI-optimized search filters
  memoryType?: MemoryType;
  minCodeRelevance?: number;
  minTechnicalDepth?: number;
}

// ENHANCED: AI-Optimized Memory Types for Superior Code Generation Context
export type MemoryType =
  | 'architecture'         // System design, components, patterns
  | 'implementation'       // Code patterns, functions, algorithms
  | 'error-solution'       // Error patterns, debugging, fixes
  | 'performance'          // Optimization, benchmarks, profiling
  | 'configuration'        // Setup, deployment, environment
  | 'testing'              // Test patterns, quality assurance
  | 'api-integration'      // API design, endpoints, services
  | 'database'             // Data models, queries, schemas
  | 'security'             // Authentication, authorization, encryption
  | 'progress'             // Status, milestones, planning
  | 'general'              // Unclassified content
  | 'project-overview'     // Project overview, goals, scope
  | 'requirements'         // Requirements, specifications
  | 'documentation'        // Documentation, guides, references
  | 'notes'                // General notes
  | 'research'             // Research findings
  | 'meeting-notes'        // Meeting notes, discussions
  | 'decisions'            // Decision records
  | 'issues'               // Issues, problems
  | 'tasks'                // Tasks, todos
  | 'other';               // Other content

// Backward compatible interfaces (keep existing functionality working)
export interface MemoryRelationships {
  dependsOn: string[];
  influences: string[];
  relatedTo: string[];
  hierarchyLevel: number;
}

// Backward compatibility interfaces (minimal implementations)
export interface StructuredMemory extends Memory {
  memoryType: MemoryType;
  templateVersion: string;
  relationships: MemoryRelationships;
  structuredData: Record<string, any>;
}

export interface MemoryValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Clean, focused interfaces for AI-optimized memory bank
