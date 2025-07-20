import { Controller, Request, Response, Validator } from "../../protocols/index.js";
import { ProjectContextDetectionUseCase } from "../../../domain/usecases/project-context-detection.js";
import { ProjectContextRequest, ProjectContextResponse } from "../../../domain/entities/project-context.js";

export interface DetectProjectContextRequest {
  workingDirectory?: string;
  validateIsolation?: boolean;
  forceDetection?: boolean;
  preferredProjectName?: string;
}

export type DetectProjectContextResponse = ProjectContextResponse;

export { 
  Controller, 
  Request, 
  Response, 
  Validator, 
  ProjectContextDetectionUseCase,
  ProjectContextRequest
};
