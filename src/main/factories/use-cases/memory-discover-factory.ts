import { MemoryDiscover } from "../../../data/usecases/memory-discover/memory-discover.js";
import { MongoDBMemoryRepository } from "../../../infra/mongodb/repositories/mongodb-memory-repository.js";

export const makeMemoryDiscover = () => {
  const memoryRepository = new MongoDBMemoryRepository();
  return new MemoryDiscover(memoryRepository);
};
