import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  RequiredFieldValidator,
  ValidatorComposite,
  ParamNameValidator,
} from "../../../../validators/index.js";
import { PathSecurityValidator } from "../../../../validators/path-security-validator.js";

const makeValidations = (): Validator[] => {
  return [
    new RequiredFieldValidator("projectName"),
    new ParamNameValidator("projectName"),
    new PathSecurityValidator("projectName"),
  ];
};

export const makeMongoDBListProjectFilesValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
