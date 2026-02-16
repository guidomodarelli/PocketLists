import type { ItemNode } from "../entities/ItemNode";
import type { List, ListSummary } from "../entities/List";

export interface ListsRepository {
  getLists(): Promise<List[]>;
  getListSummaries(): Promise<ListSummary[]>;
  getListById(listId: string): Promise<List | undefined>;
  createList(title: string): Promise<List>;
  deleteList(listId: string): Promise<boolean>;
  updateListTitle(listId: string, title: string): Promise<List | null>;
  saveListItems(listId: string, items: ItemNode[]): Promise<ItemNode[] | null>;
}
