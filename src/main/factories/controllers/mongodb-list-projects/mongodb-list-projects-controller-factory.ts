import { MongoDBListProjectsController } from "../../../../presentation/controllers/mongodb-list-projects/mongodb-list-projects-controller.js";
import { makeMongoDBListProjects } from "../../use-cases/mongodb-list-projects-factory.js";

export const makeMongoDBListProjectsController = () => {
  const listProjectsUseCase = makeMongoDBListProjects();
  return new MongoDBListProjectsController(listProjectsUseCase);
};
