import axios from 'axios';
import { mongoConfig } from '../../main/config/mongodb-config.js';

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export class VoyageEmbeddingService {
  private readonly apiUrl = 'https://api.voyageai.com/v1/embeddings';
  private readonly model = 'voyage-3'; // Latest Voyage AI model

  constructor(private readonly apiKey: string = mongoConfig.voyageApiKey || '') {
    if (!this.apiKey && mongoConfig.enableVectorSearch) {
      console.warn('Voyage AI API key not provided. Vector search will be disabled.');
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult | null> {
    if (!this.apiKey || !mongoConfig.enableVectorSearch) {
      return null;
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          input: [text],
          model: this.model,
          input_type: 'document' // For storing documents
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
        return {
          embedding: data.data[0].embedding,
          tokens: data.usage?.total_tokens || 0
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
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
          model: this.model,
          input_type: 'query' // For search queries
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
    return !!(this.apiKey && mongoConfig.enableVectorSearch && mongoConfig.isAtlas);
  }
}
