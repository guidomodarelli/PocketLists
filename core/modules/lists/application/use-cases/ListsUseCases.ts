import { randomUUID } from "node:crypto";
import type { ItemNode } from "../../domain/entities/ItemNode";
import type { List, ListSummary } from "../../domain/entities/List";
import type { ListsRepository } from "../../domain/repositories/ListsRepository";
import {
  findNode,
  normalizeTree,
  removeNodeFromTree,
  setSubtreeCompletion,
  updateNodeInTree,
} from "../../domain/services/tree";

export type ListsUseCases = {
  getLists(): Promise<List[]>;
  getListById(listId: string): Promise<List | undefined>;
  getListSummaries(): Promise<ListSummary[]>;
  getDefaultListId(): Promise<string | undefined>;
  createList(title?: string): Promise<List>;
  deleteList(listId: string): Promise<boolean>;
  updateListTitle(listId: string, title: string): Promise<List | null>;
  getNodeById(listId: string, id: string): Promise<ItemNode | undefined>;
  toggleItem(listId: string, id: string, nextCompleted: boolean): Promise<ItemNode[] | null>;
  completeParent(listId: string, id: string): Promise<ItemNode[] | null>;
  uncheckParent(listId: string, id: string): Promise<ItemNode[] | null>;
  resetCompletedItems(listId: string): Promise<ItemNode[] | null>;
  createItem(listId: string, title: string, parentId?: string): Promise<ItemNode[] | null>;
  deleteItem(listId: string, id: string): Promise<ItemNode[] | null>;
  updateItemTitle(listId: string, id: string, title: string): Promise<ItemNode[] | null>;
};

export function createListsUseCases(repository: ListsRepository): ListsUseCases {
  const getLists = async (): Promise<List[]> => {
    return repository.getLists();
  };

  const getListById = async (listId: string): Promise<List | undefined> => {
    return repository.getListById(listId);
  };

  const getListSummaries = async (): Promise<ListSummary[]> => {
    const lists = await getLists();
    return lists.map((list) => ({ id: list.id, title: list.title }));
  };

  const getDefaultListId = async (): Promise<string | undefined> => {
    return (await getLists())[0]?.id;
  };

  const createList = async (title = "Sin nombre"): Promise<List> => {
    return repository.createList(title);
  };

  const deleteList = async (listId: string): Promise<boolean> => {
    return repository.deleteList(listId);
  };

  const updateListTitle = async (listId: string, title: string): Promise<List | null> => {
    const normalizedTitle = title.trim();
    const list = await repository.getListById(listId);
    if (!list) {
      return null;
    }

    if (list.title === normalizedTitle) {
      return list;
    }

    return repository.updateListTitle(listId, normalizedTitle);
  };

  const getNodeById = async (listId: string, id: string): Promise<ItemNode | undefined> => {
    const list = await getListById(listId);
    if (!list) {
      return undefined;
    }

    return findNode(list.items, id);
  };

  const toggleItem = async (listId: string, id: string, nextCompleted: boolean): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => {
      if (node.children.length > 0) {
        return setSubtreeCompletion(node, nextCompleted);
      }
      return { ...node, completed: nextCompleted };
    });

    return repository.saveListItems(listId, normalizeTree(updated));
  };

  const completeParent = async (listId: string, id: string): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, true));
    return repository.saveListItems(listId, normalizeTree(updated));
  };

  const uncheckParent = async (listId: string, id: string): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, false));
    return repository.saveListItems(listId, normalizeTree(updated));
  };

  const resetCompletedItems = async (listId: string): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const updated = list.items.map((item) => setSubtreeCompletion(item, false));
    return repository.saveListItems(listId, normalizeTree(updated));
  };

  const createItem = async (listId: string, title: string, parentId?: string): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const newItem: ItemNode = {
      id: `item-${randomUUID()}`,
      title,
      completed: false,
      children: [],
    };

    if (!parentId) {
      return repository.saveListItems(listId, normalizeTree([newItem, ...list.items]));
    }

    const updated = updateNodeInTree(list.items, parentId, (node) => ({
      ...node,
      children: [newItem, ...node.children],
    }));

    if (updated === list.items) {
      return null;
    }

    return repository.saveListItems(listId, normalizeTree(updated));
  };

  const deleteItem = async (listId: string, id: string): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const [updated, changed] = removeNodeFromTree(list.items, id);
    if (!changed) {
      return null;
    }

    return repository.saveListItems(listId, normalizeTree(updated));
  };

  const updateItemTitle = async (listId: string, id: string, title: string): Promise<ItemNode[] | null> => {
    const list = await getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => ({
      ...node,
      title,
    }));

    if (updated === list.items) {
      return null;
    }

    return repository.saveListItems(listId, normalizeTree(updated));
  };

  return {
    getLists,
    getListById,
    getListSummaries,
    getDefaultListId,
    createList,
    deleteList,
    updateListTitle,
    getNodeById,
    toggleItem,
    completeParent,
    uncheckParent,
    resetCompletedItems,
    createItem,
    deleteItem,
    updateItemTitle,
  };
}
