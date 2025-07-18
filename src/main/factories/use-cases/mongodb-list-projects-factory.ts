import { ListProjects } from "../../../data/usecases/list-projects/list-projects.js";
import { MongoDBProjectRepository } from "../../../infra/mongodb/repositories/mongodb-project-repository.js";

export const makeMongoDBListProjects = () => {
  const projectRepository = new MongoDBProjectRepository();
  return new ListProjects(projectRepository);
};
