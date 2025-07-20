import { ProjectContextDetectionController } from "../../../../presentation/controllers/project-context-detection/project-context-detection-controller.js";
import { makeProjectContextDetection } from "../../use-cases/project-context-detection-factory.js";
import { makeProjectContextDetectionValidation } from "./project-context-detection-validation-factory.js";

export const makeProjectContextDetectionController = () => {
  const validator = makeProjectContextDetectionValidation();
  const projectContextDetectionUseCase = makeProjectContextDetection();

  return new ProjectContextDetectionController(projectContextDetectionUseCase, validator);
};
