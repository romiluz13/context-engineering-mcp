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
    new RequiredFieldValidator("fileName"),
    new ParamNameValidator("projectName"),
    new ParamNameValidator("fileName"),
    new PathSecurityValidator("projectName"),
    new PathSecurityValidator("fileName"),
  ];
};

export const makeMemoryDiscoverValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
