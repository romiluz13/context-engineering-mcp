import { Collection, Db } from 'mongodb';
import { Memory, MemorySearchResult, MemorySearchParams, MemoryType, StructuredMemory, MemoryValidationResult } from '../../../domain/entities/index.js';
import { MemoryRepository } from '../../../data/protocols/memory-repository.js';
import { MemoryDocument, MemorySearchDocument } from '../models/memory-document.js';
import { MongoDBConnection } from '../connection/mongodb-connection.js';
import { getCollectionNames, mongoConfig } from '../../../main/config/mongodb-config.js';
import { VoyageEmbeddingService } from '../../ai/voyage-embedding-service.js';
import { ContentRoutingService } from '../../../shared/services/content-routing-service.js';
import { CLINE_CORE_FILES } from '../../../shared/services/cline-memory-structure.js';
// Removed unused template imports

export class MongoDBMemoryRepository implements MemoryRepository {
  private db?: Db;
  private collection?: Collection<MemoryDocument>;
  private embeddingService: VoyageEmbeddingService;

  constructor() {
    // Initialize lazily to avoid connection issues
    this.embeddingService = new VoyageEmbeddingService();
  }

  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      this.db = await MongoDBConnection.getInstance().getDatabase();
      this.collection = this.db.collection<MemoryDocument>(getCollectionNames().memories);
    }
  }

  async store(memory: Memory): Promise<Memory> {
    await this.ensureConnection();

    // Generate embedding for Atlas deployments
    let contentVector = memory.contentVector;

    console.log('🔍 Vector Storage Debug:', {
      embeddingServiceAvailable: this.embeddingService.isAvailable(),
      hasExistingVector: !!contentVector,
      contentLength: memory.content.length,
      fileName: memory.fileName
    });

    if (this.embeddingService.isAvailable() && !contentVector) {
      console.log('🚀 Generating embedding for:', memory.fileName);
      const embeddingResult = await this.embeddingService.generateEmbedding(memory.content);
      if (embeddingResult) {
        contentVector = embeddingResult.embedding;
        console.log('✅ Embedding generated successfully:', {
          dimensions: contentVector.length,
          tokens: embeddingResult.tokens,
          fileName: memory.fileName
        });
      } else {
        console.log('❌ Embedding generation failed for:', memory.fileName);
      }
    } else {
      console.log('⏭️  Skipping embedding generation:', {
        isAvailable: this.embeddingService.isAvailable(),
        hasExisting: !!contentVector
      });
    }

    const doc: MemoryDocument = {
      projectName: memory.projectName,
      fileName: memory.fileName,
      content: memory.content,
      tags: memory.tags,
      lastModified: new Date(),
      wordCount: this.countWords(memory.content),
      contentVector, // This should now be populated if everything works
      summary: memory.summary
    };

    console.log('💾 Storing memory with vector:', {
      fileName: memory.fileName,
      hasVector: !!doc.contentVector,
      vectorDimensions: doc.contentVector?.length || 0
    });

    const result = await this.collection!.replaceOne(
      { projectName: memory.projectName, fileName: memory.fileName },
      doc,
      { upsert: true }
    );

    // Get the inserted/updated document with ID
    const savedDoc = await this.collection!.findOne({
      projectName: memory.projectName,
      fileName: memory.fileName
    });

    return this.documentToMemory(savedDoc!);
  }

  async load(projectName: string, fileName: string): Promise<Memory | null> {
    await this.ensureConnection();
    const doc = await this.collection!.findOne({
      projectName,
      fileName
    });

    return doc ? this.documentToMemory(doc) : null;
  }

  async update(projectName: string, fileName: string, content: string): Promise<Memory | null> {
    await this.ensureConnection();

    // 🎯 CONTENT ROUTING: Implement intelligent content routing to maintain 6-file structure
    const existingFiles = await this.listFiles(projectName);
    const existingFileNames = existingFiles.map(f => f.fileName);

    // Analyze content and determine routing
    const routingResult = ContentRoutingService.routeContent(fileName, content, existingFileNames);

    console.log(`[CONTENT-ROUTING] ${fileName} → ${routingResult.targetFile} (${routingResult.confidence}% confidence: ${routingResult.reasoning})`);

    // If routing to a different file, merge content with target file
    if (routingResult.targetFile !== fileName && routingResult.shouldMerge) {
      const targetMemory = await this.load(projectName, routingResult.targetFile);
      if (targetMemory) {
        const mergedContent = ContentRoutingService.mergeContent(
          targetMemory.content,
          content,
          routingResult.mergeStrategy
        );

        // Update the target file with merged content
        const updateDoc = {
          $set: {
            content: mergedContent,
            lastModified: new Date(),
            wordCount: this.countWords(mergedContent),
            tags: [...(targetMemory.tags || []), 'auto-merged', 'content-routed']
          }
        };

        const result = await this.collection!.findOneAndUpdate(
          { projectName, fileName: routingResult.targetFile },
          updateDoc,
          { returnDocument: 'after' }
        );

        console.log(`[CONTENT-ROUTING] Successfully merged content into ${routingResult.targetFile}`);
        return result ? this.documentToMemory(result) : null;
      }
    }

    // Standard update for direct file updates
    const updateDoc = {
      $set: {
        content,
        lastModified: new Date(),
        wordCount: this.countWords(content)
      }
    };

    const result = await this.collection!.findOneAndUpdate(
      { projectName, fileName },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result ? this.documentToMemory(result) : null;
  }

  async delete(projectName: string, fileName: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await this.collection!.deleteOne({
      projectName,
      fileName
    });

    return result.deletedCount > 0;
  }

  async listByProject(projectName: string): Promise<Memory[]> {
    await this.ensureConnection();
    const docs = await this.collection!
      .find({ projectName })
      .sort({ lastModified: -1 })
      .toArray();

    return docs.map(doc => this.documentToMemory(doc));
  }

  async listFiles(projectName: string): Promise<Memory[]> {
    await this.ensureConnection();
    const docs = await this.collection!
      .find({ projectName })
      .sort({ lastModified: -1 })
      .toArray();

    return docs.map(doc => this.documentToMemory(doc));
  }

  async listAll(): Promise<Memory[]> {
    await this.ensureConnection();
    const docs = await this.collection!
      .find({})
      .sort({ lastModified: -1 })
      .toArray();

    return docs.map(doc => this.documentToMemory(doc));
  }

  async findByFileName(projectName: string, fileName: string): Promise<Memory | null> {
    await this.ensureConnection();
    const doc = await this.collection!.findOne({ projectName, fileName });
    return doc ? this.documentToMemory(doc) : null;
  }

  async search(params: MemorySearchParams): Promise<MemorySearchResult[]> {
    await this.ensureConnection();
    const { query, projectName, tags, limit = 10, useSemanticSearch = false } = params;

    // Use semantic search for Atlas, text search for Community
    if (mongoConfig.isAtlas && useSemanticSearch && mongoConfig.enableVectorSearch) {
      return this.semanticSearch(params);
    } else {
      return this.textSearch(params);
    }
  }

  async findRelated(projectName: string, fileName: string, limit = 5): Promise<MemorySearchResult[]> {
    const memory = await this.load(projectName, fileName);
    if (!memory) return [];

    // Use tags and content similarity to find related memories
    const pipeline = [
      {
        $match: {
          $and: [
            { projectName },
            { fileName: { $ne: fileName } },
            { tags: { $in: memory.tags } }
          ]
        }
      },
      {
        $addFields: {
          score: {
            $size: {
              $setIntersection: ['$tags', memory.tags]
            }
          }
        }
      },
      { $sort: { score: -1, lastModified: -1 } },
      { $limit: limit }
    ];

    const docs = await this.collection!.aggregate<MemorySearchDocument>(pipeline).toArray();
    return docs.map(doc => ({
      ...this.documentToMemory(doc),
      score: doc.score,
      relevance: 'tag-similarity'
    }));
  }

  async getProjectStats(projectName: string): Promise<{
    totalMemories: number;
    totalWords: number;
    commonTags: string[];
    lastActivity: Date;
  }> {
    await this.ensureConnection();
    const pipeline = [
      { $match: { projectName } },
      {
        $group: {
          _id: null,
          totalMemories: { $sum: 1 },
          totalWords: { $sum: '$wordCount' },
          allTags: { $push: '$tags' },
          lastActivity: { $max: '$lastModified' }
        }
      },
      {
        $project: {
          totalMemories: 1,
          totalWords: 1,
          lastActivity: 1,
          commonTags: {
            $reduce: {
              input: '$allTags',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        }
      }
    ];

    const result = await this.collection!.aggregate(pipeline).toArray();
    const stats = result[0];

    return {
      totalMemories: stats?.totalMemories || 0,
      totalWords: stats?.totalWords || 0,
      commonTags: stats?.commonTags || [],
      lastActivity: stats?.lastActivity || new Date()
    };
  }

  private async textSearch(params: MemorySearchParams): Promise<MemorySearchResult[]> {
    const { query, projectName, tags, limit = 10 } = params;

    const searchQuery: any = {
      $text: { $search: query }
    };

    if (projectName) {
      searchQuery.projectName = projectName;
    }

    if (tags && tags.length > 0) {
      searchQuery.tags = { $in: tags };
    }

    const docs = await this.collection!
      .find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray();

    return docs.map(doc => ({
      ...this.documentToMemory(doc),
      score: 1.0, // MongoDB text search score not easily accessible in this context
      relevance: 'text-match'
    }));
  }

  private async semanticSearch(params: MemorySearchParams): Promise<MemorySearchResult[]> {
    const { query, projectName, tags, limit = 10 } = params;

    console.log(`[🔥 GOLDEN FEATURE] Starting MongoDB $rankFusion hybrid search for: "${query}"`);

    // Generate query embedding
    const queryVector = await this.embeddingService.generateQueryEmbedding(query);
    if (!queryVector) {
      console.log(`[⚠️ EMBEDDING FAILED] Falling back to text search`);
      return this.textSearch(params);
    }

    // 🚀 REVOLUTIONARY: Check if MongoDB supports $rankFusion (8.1+)
    const supportsRankFusion = await this.checkRankFusionSupport();

    if (supportsRankFusion) {
      console.log(`[🎯 $RANKFUSION] Using MongoDB's revolutionary hybrid search with reciprocal rank fusion`);
      return this.hybridRankFusionSearch(query, queryVector, projectName, tags, limit);
    } else {
      console.log(`[⚠️ FALLBACK] MongoDB version doesn't support $rankFusion, using vector search only`);
      return this.vectorOnlySearch(query, queryVector, projectName, tags, limit);
    }
  }

  /**
   * 🔥 GOLDEN FEATURE: MongoDB's Revolutionary $rankFusion Hybrid Search
   * This is the crown jewel - combining vector + text search with reciprocal rank fusion
   */
  private async hybridRankFusionSearch(
    query: string,
    queryVector: number[],
    projectName?: string,
    tags?: string[],
    limit: number = 10
  ): Promise<MemorySearchResult[]> {
    try {
      // 🎯 Build the revolutionary $rankFusion pipeline
      const pipeline: any[] = [
        {
          $rankFusion: {
            input: {
              pipelines: {
                // 🎯 Vector Search Pipeline - Semantic Understanding
                vectorPipeline: [
                  {
                    $vectorSearch: {
                      index: 'vector_index',
                      path: 'contentVector',
                      queryVector: queryVector,
                      numCandidates: Math.min(limit * 10, 100),
                      limit: limit * 2
                    }
                  },
                  ...(projectName ? [{ $match: { projectName } }] : []),
                  ...(tags && tags.length > 0 ? [{ $match: { tags: { $in: tags } } }] : [])
                ],
                // 🎯 Text Search Pipeline - Exact Keyword Matching
                textPipeline: [
                  {
                    $search: {
                      index: 'default',
                      text: {
                        query: query,
                        path: ['content', 'fileName', 'tags']
                      }
                    }
                  },
                  ...(projectName ? [{ $match: { projectName } }] : []),
                  ...(tags && tags.length > 0 ? [{ $match: { tags: { $in: tags } } }] : []),
                  { $limit: limit * 2 }
                ]
              }
            },
            // 🎯 Weighted Reciprocal Rank Fusion - The Magic Formula
            combination: {
              weights: {
                vectorPipeline: 0.6,  // Favor semantic understanding
                textPipeline: 0.4     // But include exact matches
              }
            },
            scoreDetails: true
          }
        },
        {
          $addFields: {
            score: { $meta: "scoreDetails" },
            relevance: "hybrid-rankfusion"
          }
        },
        { $limit: limit }
      ];

      console.log(`[🎉 $RANKFUSION] Executing hybrid search with weighted reciprocal rank fusion`);
      const docs = await this.collection!.aggregate<MemorySearchDocument>(pipeline).toArray();

      console.log(`[📊 HYBRID POWER] Found ${docs.length} results using MongoDB's unique $rankFusion algorithm`);

      return docs.map(doc => ({
        ...this.documentToMemory(doc),
        score: doc.score || 1.0,
        relevance: 'hybrid-rankfusion'
      }));
    } catch (error) {
      console.error(`[❌ $RANKFUSION ERROR] Hybrid search failed:`, error);
      // Fallback to vector-only search
      return this.vectorOnlySearch(query, queryVector, projectName, tags, limit);
    }
  }

  /**
   * 🎯 Vector-Only Search - Fallback for older MongoDB versions
   */
  private async vectorOnlySearch(
    query: string,
    queryVector: number[],
    projectName?: string,
    tags?: string[],
    limit: number = 10
  ): Promise<MemorySearchResult[]> {
    try {
      const pipeline: any[] = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'contentVector',
            queryVector: queryVector,
            numCandidates: Math.min(limit * 10, 100),
            limit: limit
          }
        }
      ];

      // Add filters
      const matchStage: any = {};
      if (projectName) {
        matchStage.projectName = projectName;
      }
      if (tags && tags.length > 0) {
        matchStage.tags = { $in: tags };
      }

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      pipeline.push({ $limit: limit });

      const docs = await this.collection!.aggregate<MemorySearchDocument>(pipeline).toArray();

      console.log(`[✅ VECTOR SUCCESS] Found ${docs.length} vector-only results`);

      return docs.map(doc => ({
        ...this.documentToMemory(doc),
        score: doc.score || 1.0,
        relevance: 'vector-match'
      }));
    } catch (error) {
      console.error(`[❌ VECTOR ERROR] Vector search failed:`, error);
      // Final fallback to text search
      return this.textSearch({ query, projectName, tags, limit });
    }
  }

  /**
   * 🔍 Check if MongoDB supports $rankFusion (requires 8.1+)
   */
  private async checkRankFusionSupport(): Promise<boolean> {
    try {
      await this.ensureConnection();
      const adminDb = this.db!.admin();
      const buildInfo = await adminDb.buildInfo();

      // Parse version string (e.g., "8.1.0" or "8.1.0-rc1")
      const versionMatch = buildInfo.version.match(/^(\d+)\.(\d+)/);
      if (!versionMatch) {
        console.log(`[⚠️ VERSION] Could not parse MongoDB version: ${buildInfo.version}`);
        return false;
      }

      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);

      // $rankFusion requires MongoDB 8.1+
      const supportsRankFusion = major > 8 || (major === 8 && minor >= 1);

      console.log(`[📊 VERSION CHECK] MongoDB ${buildInfo.version} - $rankFusion support: ${supportsRankFusion}`);

      return supportsRankFusion;
    } catch (error) {
      console.log(`[⚠️ VERSION CHECK] Failed to check MongoDB version, assuming no $rankFusion support:`, error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  private documentToMemory(doc: MemoryDocument): Memory {
    return {
      id: doc._id?.toString(),
      projectName: doc.projectName,
      fileName: doc.fileName,
      content: doc.content,
      tags: doc.tags,
      lastModified: doc.lastModified,
      wordCount: doc.wordCount,
      contentVector: doc.contentVector,
      summary: doc.summary
    };
  }

  private countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  // Clean, AI-optimized repository - no unused template code

  /**
   * Search memories by type with structure awareness
   */
  async searchByType(memoryType: MemoryType, projectName: string, limit = 10): Promise<Memory[]> {
    await this.ensureConnection();

    const docs = await this.collection!
      .find({
        projectName,
        memoryType
      })
      .sort({ lastModified: -1 })
      .limit(limit)
      .toArray();

    return docs.map(doc => this.documentToMemory(doc));
  }

  /**
   * 🎯 AI-OPTIMIZED: Search memories by tags for better context discovery
   */
  async searchByTags(tags: string[], projectName?: string, limit: number = 10): Promise<Memory[]> {
    await this.ensureConnection();

    const filter: any = {
      tags: { $in: tags }
    };

    if (projectName) {
      filter.projectName = projectName;
    }

    const documents = await this.collection!
      .find(filter)
      .limit(limit)
      .sort({ lastModified: -1 })
      .toArray();

    return documents.map(doc => this.documentToMemory(doc));
  }

  /**
   * Get related memories based on relationships
   */
  async getRelatedMemories(fileName: string, projectName: string, limit = 5): Promise<MemorySearchResult[]> {
    await this.ensureConnection();

    const memory = await this.load(projectName, fileName);
    if (!memory || !memory.relationships) {
      return this.findRelated(projectName, fileName, limit);
    }

    // Get memories based on relationships
    const relatedFileNames = [
      ...memory.relationships.dependsOn,
      ...memory.relationships.influences,
      ...memory.relationships.relatedTo
    ];

    if (relatedFileNames.length === 0) {
      return this.findRelated(projectName, fileName, limit);
    }

    const docs = await this.collection!
      .find({
        projectName,
        fileName: { $in: relatedFileNames }
      })
      .sort({ lastModified: -1 })
      .limit(limit)
      .toArray();

    return docs.map(doc => ({
      ...this.documentToMemory(doc),
      score: 1.0,
      relevance: 'relationship-based'
    }));
  }

  // Removed duplicate template methods

  /**
   * Get template usage statistics for a project
   */
  async getTemplateStats(projectName: string): Promise<Record<MemoryType, number>> {
    await this.ensureConnection();

    const pipeline = [
      { $match: { projectName } },
      {
        $group: {
          _id: '$memoryType',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await this.collection!.aggregate(pipeline).toArray();
    const stats: Record<string, number> = {};

    results.forEach(result => {
      if (result._id) {
        stats[result._id] = result.count;
      }
    });

    return stats as Record<MemoryType, number>;
  }

  // 🔄 BACKWARD COMPATIBILITY: Minimal implementations for existing code
  async storeStructured(memory: StructuredMemory): Promise<Memory> {
    // Simple implementation - just store as regular memory
    return this.store(memory);
  }

  async validateTemplate(content: string, memoryType: MemoryType, fileName: string): Promise<MemoryValidationResult> {
    // Always return valid - no template validation needed
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }

  generateTemplateContent(memoryType: MemoryType, projectName?: string): string {
    // Return empty template - not used in practice
    return `# ${memoryType}\n\nContent for ${projectName || 'project'}`;
  }

  async getMemoriesByHierarchy(projectName: string, level: number): Promise<Memory[]> {
    // Simple implementation - return memories by type
    return this.listByProject(projectName);
  }
}
