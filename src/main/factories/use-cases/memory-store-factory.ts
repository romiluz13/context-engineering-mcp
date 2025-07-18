import { MemoryStore } from "../../../data/usecases/memory-store/memory-store.js";
import { MongoDBMemoryRepository } from "../../../infra/mongodb/repositories/mongodb-memory-repository.js";
import { MongoDBProjectRepository } from "../../../infra/mongodb/repositories/mongodb-project-repository.js";

export const makeMemoryStore = () => {
  const memoryRepository = new MongoDBMemoryRepository();
  const projectRepository = new MongoDBProjectRepository();

  return new MemoryStore(memoryRepository, projectRepository);
};
