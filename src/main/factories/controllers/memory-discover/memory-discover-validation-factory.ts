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
    new RequiredFieldValidator("fileName"),
    new ParamNameValidator("fileName"),
    new PathSecurityValidator("fileName"),
  ];
};

export const makeMemoryDiscoverValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
