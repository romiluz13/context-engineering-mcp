export const env = {
  // MongoDB configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'memory_bank',
  mongodbAtlas: process.env.MONGODB_ATLAS === 'true',
  enableVectorSearch: process.env.ENABLE_VECTOR_SEARCH === 'true',
  voyageApiKey: process.env.VOYAGE_API_KEY
};
