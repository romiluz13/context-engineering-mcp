import { MongoDBListProjectFilesController } from "../../../../presentation/controllers/mongodb-list-project-files/mongodb-list-project-files-controller.js";
import { MongoDBMemoryRepository } from "../../../../infra/mongodb/repositories/mongodb-memory-repository.js";
import { makeMongoDBListProjectFilesValidation } from "./mongodb-list-project-files-validation-factory.js";

export const makeMongoDBListProjectFilesController = () => {
  const validator = makeMongoDBListProjectFilesValidation();
  const memoryRepository = new MongoDBMemoryRepository();

  return new MongoDBListProjectFilesController(memoryRepository, validator);
};
