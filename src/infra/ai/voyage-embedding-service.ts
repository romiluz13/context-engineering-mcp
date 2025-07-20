import axios from 'axios';
import { mongoConfig } from '../../main/config/mongodb-config.js';

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export class VoyageEmbeddingService {
  private readonly apiUrl = 'https://api.voyageai.com/v1/embeddings';
  private readonly model = 'voyage-3.5'; // ✅ UPDATED: Use current recommended model

  constructor(private readonly apiKey: string = mongoConfig.voyageApiKey || '') {
    // ✅ ENHANCED: Comprehensive debugging
    console.log('🔍 VoyageEmbeddingService Debug:', {
      apiKeyPresent: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'MISSING',
      enableVectorSearch: mongoConfig.enableVectorSearch,
      isAtlas: mongoConfig.isAtlas,
      isAvailable: this.isAvailable(),
      mongoConfigKeys: Object.keys(mongoConfig)
    });

    if (!this.apiKey && mongoConfig.enableVectorSearch) {
      console.warn('⚠️  Voyage AI API key not provided. Vector search will be disabled.');
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult | null> {
    if (!this.apiKey || !mongoConfig.enableVectorSearch) {
      console.log('❌ Embedding generation skipped:', {
        hasApiKey: !!this.apiKey,
        enableVectorSearch: mongoConfig.enableVectorSearch
      });
      return null;
    }

    try {
      console.log('🚀 Generating embedding with Voyage AI...');
      const response = await axios.post(
        this.apiUrl,
        {
          input: [text],
          model: this.model, // voyage-3.5
          input_type: 'document' // ✅ CORRECT: For storing documents
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const data = response.data;
      if (data.data && data.data.length > 0) {
        console.log('✅ Embedding generated successfully:', {
          dimensions: data.data[0].embedding.length,
          tokens: data.usage?.total_tokens || 0
        });
        return {
          embedding: data.data[0].embedding,
          tokens: data.usage?.total_tokens || 0
        };
      }

      console.log('❌ No embedding data in response');
      return null;
    } catch (error: any) {
      console.error('❌ Failed to generate embedding:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return null;
    }
  }

  async generateQueryEmbedding(query: string): Promise<number[] | null> {
    if (!this.apiKey || !mongoConfig.enableVectorSearch) {
      return null;
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          input: [query],
          model: this.model, // voyage-3.5
          input_type: 'query' // ✅ CORRECT: For search queries
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout for queries
        }
      );

      const data = response.data;
      if (data.data && data.data.length > 0) {
        return data.data[0].embedding;
      }

      return null;
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    const available = !!(this.apiKey && mongoConfig.enableVectorSearch && mongoConfig.isAtlas);
    console.log('🔍 VoyageEmbeddingService.isAvailable():', {
      apiKey: !!this.apiKey,
      enableVectorSearch: mongoConfig.enableVectorSearch,
      isAtlas: mongoConfig.isAtlas,
      result: available
    });
    return available;
  }
}
