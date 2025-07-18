import { MongoDBUpdateController } from "../../../../presentation/controllers/mongodb-update/mongodb-update-controller.js";
import { MongoDBMemoryRepository } from "../../../../infra/mongodb/repositories/mongodb-memory-repository.js";
import { makeMongoDBUpdateValidation } from "./mongodb-update-validation-factory.js";

export const makeMongoDBUpdateController = () => {
  const validator = makeMongoDBUpdateValidation();
  const memoryRepository = new MongoDBMemoryRepository();

  return new MongoDBUpdateController(memoryRepository, validator);
};
