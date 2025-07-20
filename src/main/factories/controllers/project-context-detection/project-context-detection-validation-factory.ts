import { Validator } from "../../../../presentation/protocols/validator.js";
import {
  ValidatorComposite,
} from "../../../../validators/index.js";

const makeValidations = (): Validator[] => {
  return [
    // No required fields - all parameters are optional
    // workingDirectory defaults to process.cwd()
    // validateIsolation defaults to true
    // forceDetection and preferredProjectName are optional
  ];
};

export const makeProjectContextDetectionValidation = (): Validator => {
  const validations = makeValidations();
  return new ValidatorComposite(validations);
};
