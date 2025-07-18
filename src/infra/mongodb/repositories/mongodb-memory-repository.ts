import { Collection, Db } from 'mongodb';
import { Memory, MemorySearchResult, MemorySearchParams } from '../../../domain/entities/index.js';
import { MemoryRepository } from '../../../data/protocols/memory-repository.js';
import { MemoryDocument, MemorySearchDocument } from '../models/memory-document.js';
import { MongoDBConnection } from '../connection/mongodb-connection.js';
import { getCollectionNames, mongoConfig } from '../../../main/config/mongodb-config.js';
import { VoyageEmbeddingService } from '../../ai/voyage-embedding-service.js';

export class MongoDBMemoryRepository implements MemoryRepository {
  private db: Db;
  private collection: Collection<MemoryDocument>;
  private embeddingService: VoyageEmbeddingService;

  constructor() {
    this.db = MongoDBConnection.getInstance().getDatabase();
    this.collection = this.db.collection<MemoryDocument>(getCollectionNames().memories);
    this.embeddingService = new VoyageEmbeddingService();
  }

  async store(memory: Memory): Promise<Memory> {
    // Generate embedding for Atlas deployments
    let contentVector = memory.contentVector;
    if (this.embeddingService.isAvailable() && !contentVector) {
      const embeddingResult = await this.embeddingService.generateEmbedding(memory.content);
      if (embeddingResult) {
        contentVector = embeddingResult.embedding;
      }
    }

    const doc: MemoryDocument = {
      projectName: memory.projectName,
      fileName: memory.fileName,
      content: memory.content,
      tags: memory.tags,
      lastModified: new Date(),
      wordCount: this.countWords(memory.content),
      contentVector,
      summary: memory.summary
    };

    const result = await this.collection.replaceOne(
      { projectName: memory.projectName, fileName: memory.fileName },
      doc,
      { upsert: true }
    );

    // Get the inserted/updated document with ID
    const savedDoc = await this.collection.findOne({
      projectName: memory.projectName,
      fileName: memory.fileName
    });

    return this.documentToMemory(savedDoc!);
  }

  async load(projectName: string, fileName: string): Promise<Memory | null> {
    const doc = await this.collection.findOne({
      projectName,
      fileName
    });

    return doc ? this.documentToMemory(doc) : null;
  }

  async update(projectName: string, fileName: string, content: string): Promise<Memory | null> {
    const updateDoc = {
      $set: {
        content,
        lastModified: new Date(),
        wordCount: this.countWords(content)
      }
    };

    const result = await this.collection.findOneAndUpdate(
      { projectName, fileName },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result ? this.documentToMemory(result) : null;
  }

  async delete(projectName: string, fileName: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      projectName,
      fileName
    });

    return result.deletedCount > 0;
  }

  async listByProject(projectName: string): Promise<Memory[]> {
    const docs = await this.collection
      .find({ projectName })
      .sort({ lastModified: -1 })
      .toArray();

    return docs.map(doc => this.documentToMemory(doc));
  }

  async listAll(): Promise<Memory[]> {
    const docs = await this.collection
      .find({})
      .sort({ lastModified: -1 })
      .toArray();

    return docs.map(doc => this.documentToMemory(doc));
  }

  async search(params: MemorySearchParams): Promise<MemorySearchResult[]> {
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

    const docs = await this.collection.aggregate<MemorySearchDocument>(pipeline).toArray();
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

    const result = await this.collection.aggregate(pipeline).toArray();
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

    const docs = await this.collection
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

    // Generate query embedding
    const queryVector = await this.embeddingService.generateQueryEmbedding(query);
    if (!queryVector) {
      // Fall back to text search if embedding generation fails
      return this.textSearch(params);
    }

    // Build aggregation pipeline for hybrid search
    const pipeline: any[] = [];

    // Vector search pipeline
    const vectorSearchStage = {
      $vectorSearch: {
        index: 'vector_index', // This would need to be created in Atlas
        path: 'contentVector',
        queryVector: queryVector,
        numCandidates: limit * 10,
        limit: limit
      }
    };

    // Text search pipeline
    const textSearchStage = {
      $search: {
        index: 'text_index', // This would need to be created in Atlas
        text: {
          query: query,
          path: ['content', 'fileName', 'tags']
        }
      }
    };

    // Use $rankFusion for hybrid search (MongoDB 8.1+ with automatic fallback)
    if (mongoConfig.isAtlas) {
      pipeline.push({
        $rankFusion: {
          input: {
            pipelines: [
              [vectorSearchStage],
              [textSearchStage]
            ]
          }
        }
      });
    } else {
      // Fallback to vector search only
      pipeline.push(vectorSearchStage);
    }

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

    try {
      const docs = await this.collection.aggregate<MemorySearchDocument>(pipeline).toArray();
      return docs.map(doc => ({
        ...this.documentToMemory(doc),
        score: doc.score || 1.0,
        relevance: 'semantic-match'
      }));
    } catch (error) {
      console.error('Semantic search failed, falling back to text search:', error);
      return this.textSearch(params);
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
}
