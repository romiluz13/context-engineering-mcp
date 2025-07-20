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
  // NEW: Structured template support (backward compatible)
  memoryType?: MemoryType;
  templateVersion?: string;
  relationships?: MemoryRelationships;
  structuredData?: Record<string, any>;
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
  // NEW: Structured search support
  memoryType?: MemoryType;
  includeRelationships?: boolean;
}

// NEW: Structured Memory Template System
export type MemoryType =
  | 'project-brief'        // Core requirements/goals
  | 'system-patterns'      // Architecture/patterns
  | 'tech-context'         // Tech stack/setup
  | 'active-context'       // Current focus/decisions
  | 'progress-tracking'    // Status/roadmap
  | 'code-patterns'        // Code structure/conventions
  | 'error-solutions'      // Error patterns/fixes
  | 'implementation-rules' // AI behavior patterns (.clinerules equivalent)
  | 'custom';              // User-defined templates

export interface MemoryRelationships {
  dependsOn: string[];      // Files this memory depends on
  influences: string[];     // Files this memory influences
  relatedTo: string[];      // Related memories
  hierarchyLevel: number;   // 0=foundation, 1=active, 2=tracking
}

export interface StructuredMemory extends Memory {
  memoryType: MemoryType;
  templateVersion: string;
  relationships: MemoryRelationships;
  structuredData: Record<string, any>;
}

export interface MemoryTemplate {
  type: MemoryType;
  version: string;
  name: string;
  description: string;
  schema: TemplateSchema;
  defaultContent: string;
  validationRules: ValidationRule[];
  relationships: {
    requiredDependencies: MemoryType[];
    optionalDependencies: MemoryType[];
    influences: MemoryType[];
  };
}

export interface TemplateSchema {
  sections: TemplateSection[];
  requiredFields: string[];
  optionalFields: string[];
}

export interface TemplateSection {
  name: string;
  description: string;
  required: boolean;
  format: 'markdown' | 'yaml' | 'json' | 'text';
  placeholder?: string;
  validation?: string; // regex pattern
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
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
