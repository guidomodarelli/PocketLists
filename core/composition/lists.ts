import { getCoreSetup } from "@/core/setup";
import type { ListsUseCases } from "@/core/modules/lists/application/use-cases/ListsUseCases";

export async function getListsUseCases(): Promise<ListsUseCases> {
  const setup = await getCoreSetup();
  return setup.lists;
}
