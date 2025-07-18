export interface MongoDBConfig {
  connectionString: string;
  databaseName: string;
  isAtlas: boolean;
  enableVectorSearch: boolean;
  voyageApiKey?: string;
}

export const mongoConfig: MongoDBConfig = {
  connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  databaseName: process.env.MONGODB_DATABASE || 'memory_bank',
  isAtlas: process.env.MONGODB_ATLAS === 'true',
  enableVectorSearch: process.env.ENABLE_VECTOR_SEARCH === 'true',
  voyageApiKey: process.env.VOYAGE_API_KEY
};

export const getCollectionNames = () => ({
  memories: 'memories',
  projects: 'projects'
});
