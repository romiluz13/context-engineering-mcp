import { MemoryDiscoverController } from "../../../../presentation/controllers/memory-discover/memory-discover-controller.js";
import { makeMemoryDiscover } from "../../use-cases/memory-discover-factory.js";
import { makeMemoryDiscoverValidation } from "./memory-discover-validation-factory.js";

export const makeMemoryDiscoverController = () => {
  const validator = makeMemoryDiscoverValidation();
  const memoryDiscoverUseCase = makeMemoryDiscover();

  return new MemoryDiscoverController(memoryDiscoverUseCase, validator);
};
