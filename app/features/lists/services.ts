import type { ItemNode, List, ListSummary } from "./types";
import { getListsUseCases } from "@/core/composition/lists";

export async function getLists(): Promise<List[]> {
  const useCases = await getListsUseCases();
  return useCases.getLists();
}

export async function getListById(listId: string): Promise<List | undefined> {
  const useCases = await getListsUseCases();
  return useCases.getListById(listId);
}

export async function getListSummaries(): Promise<ListSummary[]> {
  const useCases = await getListsUseCases();
  return useCases.getListSummaries();
}

export async function getDefaultListId(): Promise<string | undefined> {
  const useCases = await getListsUseCases();
  return useCases.getDefaultListId();
}

export async function createList(title = "Sin nombre"): Promise<List> {
  const useCases = await getListsUseCases();
  return useCases.createList(title);
}

export async function deleteList(listId: string): Promise<boolean> {
  const useCases = await getListsUseCases();
  return useCases.deleteList(listId);
}

export async function updateListTitle(listId: string, title: string): Promise<List | null> {
  const useCases = await getListsUseCases();
  return useCases.updateListTitle(listId, title);
}

export async function getNodeById(listId: string, id: string): Promise<ItemNode | undefined> {
  const useCases = await getListsUseCases();
  return useCases.getNodeById(listId, id);
}

export async function toggleItem(
  listId: string,
  id: string,
  nextCompleted: boolean
): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.toggleItem(listId, id, nextCompleted);
}

export async function completeParent(listId: string, id: string): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.completeParent(listId, id);
}

export async function uncheckParent(listId: string, id: string): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.uncheckParent(listId, id);
}

export async function resetCompletedItems(listId: string): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.resetCompletedItems(listId);
}

export async function createItem(listId: string, title: string, parentId?: string): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.createItem(listId, title, parentId);
}

export async function deleteItem(listId: string, id: string): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.deleteItem(listId, id);
}

export async function updateItemTitle(
  listId: string,
  id: string,
  title: string
): Promise<ItemNode[] | null> {
  const useCases = await getListsUseCases();
  return useCases.updateItemTitle(listId, id, title);
}
