import type { ItemNode } from "../entities/ItemNode";
import type { List } from "../entities/List";

export interface ListsRepository {
  initialize(): Promise<void>;
  getLists(): Promise<List[]>;
  getListById(listId: string): Promise<List | undefined>;
  createList(title: string): Promise<List>;
  deleteList(listId: string): Promise<boolean>;
  updateListTitle(listId: string, title: string): Promise<List | null>;
  saveListItems(listId: string, items: ItemNode[]): Promise<ItemNode[] | null>;
}
