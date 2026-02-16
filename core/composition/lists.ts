import { ListsUseCases } from "@/core/modules/lists/application/use-cases/ListsUseCases";
import { TursoListsRepository } from "@/core/modules/lists/infrastructure/repositories/TursoListsRepository";

export async function getListsUseCases(): Promise<ListsUseCases> {
  const repository = new TursoListsRepository();
  await repository.initialize();
  return new ListsUseCases(repository);
}
