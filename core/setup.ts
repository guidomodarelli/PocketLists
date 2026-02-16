import { createListsUseCases, type ListsUseCases } from "@/core/modules/lists/application/use-cases/ListsUseCases";
import { TursoListsRepository } from "@/core/modules/lists/infrastructure/repositories/TursoListsRepository";

export type CoreSetup = {
  lists: ListsUseCases;
};

class CoreSetupContainer {
  private readonly listsRepository = new TursoListsRepository();
  private readonly setup: CoreSetup;

  constructor() {
    this.setup = {
      lists: createListsUseCases(this.listsRepository),
    };
  }

  getSetup(): Promise<CoreSetup> {
    return Promise.resolve(this.setup);
  }
}

const coreSetupContainer = new CoreSetupContainer();

export function getCoreSetup(): Promise<CoreSetup> {
  return coreSetupContainer.getSetup();
}
