import { MemorySearchController } from "../../../../presentation/controllers/memory-search/memory-search-controller.js";
import { makeMemorySearch } from "../../use-cases/memory-search-factory.js";
import { makeMemorySearchValidation } from "./memory-search-validation-factory.js";

export const makeMemorySearchController = () => {
  const validator = makeMemorySearchValidation();
  const memorySearchUseCase = makeMemorySearch();

  return new MemorySearchController(memorySearchUseCase, validator);
};
