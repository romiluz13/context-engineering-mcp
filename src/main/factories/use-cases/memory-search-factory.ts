import { MemorySearch } from "../../../data/usecases/memory-search/memory-search.js";
import { MongoDBMemoryRepository } from "../../../infra/mongodb/repositories/mongodb-memory-repository.js";

export const makeMemorySearch = () => {
  const memoryRepository = new MongoDBMemoryRepository();
  return new MemorySearch(memoryRepository);
};
