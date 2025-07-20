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
        apiKeyLength: this.apiKey?.length || 0,
        enableVectorSearch: mongoConfig.enableVectorSearch,
        isAtlas: mongoConfig.isAtlas
      });
      return null;
    }

    try {
      console.log('🚀 Generating embedding with Voyage AI...', {
        textLength: text.length,
        model: this.model,
        apiUrl: this.apiUrl,
        apiKeyPrefix: this.apiKey.substring(0, 12) + '...',
        headers: {
          'Authorization': `Bearer ${this.apiKey.substring(0, 12)}...`,
          'Content-Type': 'application/json'
        }
      });

      const requestPayload = {
        input: [text],
        model: this.model, // voyage-3.5
        input_type: 'document' // ✅ CORRECT: For storing documents
      };

      console.log('📤 Request payload:', {
        input: [`${text.substring(0, 100)}...`],
        model: requestPayload.model,
        input_type: requestPayload.input_type
      });

      const response = await axios.post(
        this.apiUrl,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // Increased to 15 second timeout
        }
      );

      console.log('📥 Raw response status:', response.status);
      console.log('📥 Raw response headers:', response.headers);

      const data = response.data;
      console.log('📥 Response data structure:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        hasDataArray: !!(data && data.data),
        dataArrayLength: data?.data?.length || 0,
        hasUsage: !!(data && data.usage),
        fullResponse: JSON.stringify(data, null, 2)
      });

      if (data && data.data && data.data.length > 0) {
        const embedding = data.data[0].embedding;
        const tokens = data.usage?.total_tokens || 0;

        console.log('✅ Embedding generated successfully:', {
          dimensions: embedding?.length || 0,
          tokens: tokens,
          embeddingType: typeof embedding,
          isArray: Array.isArray(embedding),
          firstFewValues: embedding?.slice(0, 5) || []
        });

        return {
          embedding: embedding,
          tokens: tokens
        };
      }

      console.log('❌ No embedding data in response:', {
        responseStructure: data,
        hasData: !!data,
        hasDataArray: !!(data && data.data),
        dataArrayLength: data?.data?.length || 0
      });
      return null;
    } catch (error: any) {
      console.error('❌ Failed to generate embedding - DETAILED ERROR:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        },
        isAxiosError: error.isAxiosError,
        code: error.code,
        stack: error.stack
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
    console.log('🔍 VoyageEmbeddingService.isAvailable() - DETAILED CHECK:', {
      apiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 12) + '...' : 'MISSING',
      apiKeyStartsWith: this.apiKey ? this.apiKey.substring(0, 3) : 'N/A',
      enableVectorSearch: mongoConfig.enableVectorSearch,
      isAtlas: mongoConfig.isAtlas,
      result: available,
      environmentVariables: {
        VOYAGE_API_KEY: !!process.env.VOYAGE_API_KEY,
        ENABLE_VECTOR_SEARCH: process.env.ENABLE_VECTOR_SEARCH,
        MONGODB_ATLAS: process.env.MONGODB_ATLAS
      },
      mongoConfigValues: {
        voyageApiKey: !!mongoConfig.voyageApiKey,
        enableVectorSearch: mongoConfig.enableVectorSearch,
        isAtlas: mongoConfig.isAtlas
      }
    });
    return available;
  }

  /**
   * Test API key validity with a simple API call
   */
  async testApiConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    if (!this.apiKey) {
      return { success: false, error: 'No API key provided' };
    }

    try {
      console.log('🧪 Testing Voyage AI API connection...');
      const response = await axios.post(
        this.apiUrl,
        {
          input: ['test'],
          model: this.model,
          input_type: 'document'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ API connection test successful:', {
        status: response.status,
        hasData: !!response.data?.data,
        dataLength: response.data?.data?.length || 0
      });

      return {
        success: true,
        details: {
          status: response.status,
          model: response.data?.model,
          usage: response.data?.usage
        }
      };
    } catch (error: any) {
      console.error('❌ API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  }
}
