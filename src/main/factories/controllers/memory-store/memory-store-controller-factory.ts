import { MemoryStoreController } from "../../../../presentation/controllers/memory-store/memory-store-controller.js";
import { makeMemoryStore } from "../../use-cases/memory-store-factory.js";
import { makeMemoryStoreValidation } from "./memory-store-validation-factory.js";

export const makeMemoryStoreController = () => {
  const validator = makeMemoryStoreValidation();
  const memoryStoreUseCase = makeMemoryStore();

  return new MemoryStoreController(memoryStoreUseCase, validator);
};
