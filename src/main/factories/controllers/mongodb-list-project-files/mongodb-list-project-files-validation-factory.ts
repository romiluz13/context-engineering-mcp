import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  RequiredFieldValidator,
  ValidatorComposite,
  ParamNameValidator,
} from "../../../../validators/index.js";
import { PathSecurityValidator } from "../../../../validators/path-security-validator.js";

const makeValidations = (): Validator[] => {
  return [
    // projectName is automatically injected by path-based adapter
    // No validation needed for user input
  ];
};

export const makeMongoDBListProjectFilesValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
