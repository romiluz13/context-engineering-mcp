import { MemoryLoadController } from "../../../../presentation/controllers/memory-load/memory-load-controller.js";
import { makeMemoryLoad } from "../../use-cases/memory-load-factory.js";
import { makeMemoryLoadValidation } from "./memory-load-validation-factory.js";

export const makeMemoryLoadController = () => {
  const validator = makeMemoryLoadValidation();
  const memoryLoadUseCase = makeMemoryLoad();

  return new MemoryLoadController(memoryLoadUseCase, validator);
};
