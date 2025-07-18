import { MemoryLoad } from "../../../data/usecases/memory-load/memory-load.js";
import { MongoDBMemoryRepository } from "../../../infra/mongodb/repositories/mongodb-memory-repository.js";

export const makeMemoryLoad = () => {
  const memoryRepository = new MongoDBMemoryRepository();
  return new MemoryLoad(memoryRepository);
};
