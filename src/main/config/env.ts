export const env = {
  rootPath: process.env.MEMORY_BANK_ROOT!,
  // MongoDB configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'memory_bank',
  mongodbAtlas: process.env.MONGODB_ATLAS === 'true',
  enableVectorSearch: process.env.ENABLE_VECTOR_SEARCH === 'true',
  voyageApiKey: process.env.VOYAGE_API_KEY,
  // Storage mode: 'file' or 'mongodb'
  storageMode: process.env.STORAGE_MODE || 'file'
};
