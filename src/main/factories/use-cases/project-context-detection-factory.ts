import { ProjectContextDetection } from "../../../data/usecases/project-context-detection/project-context-detection.js";
import { MongoDBProjectRepository } from "../../../infra/mongodb/repositories/mongodb-project-repository.js";

export const makeProjectContextDetection = () => {
  const projectRepository = new MongoDBProjectRepository();
  return new ProjectContextDetection(projectRepository);
};
