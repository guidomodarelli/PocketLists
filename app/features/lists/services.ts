import { randomUUID } from "node:crypto";
import { INITIAL_LISTS } from "./data";
import type { ItemNode, List, ListSummary } from "./types";
import { findNode, normalizeTree, setSubtreeCompletion, updateNodeInTree } from "./tree";

type ListsStore = {
  lists: List[];
};

type GlobalStore = typeof globalThis & {
  __pocketListsStore?: ListsStore | { items?: ItemNode[] };
};

const globalStore = globalThis as GlobalStore;

function buildInitialLists(): List[] {
  return INITIAL_LISTS.map((list) => ({
    ...list,
    items: normalizeTree(list.items),
  }));
}

function normalizeListsStore(store: List[]): List[] {
  return store.map((list) => ({
    ...list,
    items: normalizeTree(list.items),
  }));
}

function migrateLegacyStore(legacyItems: ItemNode[]): ListsStore {
  const baseList = INITIAL_LISTS[0];
  return {
    lists: [
      {
        id: baseList?.id ?? `list-${randomUUID()}`,
        title: baseList?.title ?? "Sin nombre",
        items: normalizeTree(legacyItems),
      },
    ],
  };
}

function readStore(): ListsStore {
  const currentStore = globalStore.__pocketListsStore;

  if (!currentStore) {
    const nextStore: ListsStore = { lists: buildInitialLists() };
    globalStore.__pocketListsStore = nextStore;
    return nextStore;
  }

  if ("lists" in currentStore && Array.isArray(currentStore.lists)) {
    const nextStore: ListsStore = { lists: normalizeListsStore(currentStore.lists) };
    globalStore.__pocketListsStore = nextStore;
    return nextStore;
  }

  if ("items" in currentStore && Array.isArray(currentStore.items)) {
    const nextStore = migrateLegacyStore(currentStore.items);
    globalStore.__pocketListsStore = nextStore;
    return nextStore;
  }

  const fallbackStore: ListsStore = { lists: buildInitialLists() };
  globalStore.__pocketListsStore = fallbackStore;
  return fallbackStore;
}

function writeStore(lists: List[]): void {
  const store = readStore();
  store.lists = lists;
}

function getStoreLists(): List[] {
  return readStore().lists;
}

function getStoreListById(listId: string): List | undefined {
  return getStoreLists().find((list) => list.id === listId);
}

function writeStoreListItems(listId: string, items: ItemNode[]): ItemNode[] | null {
  const lists = getStoreLists();
  const listIndex = lists.findIndex((list) => list.id === listId);
  if (listIndex === -1) {
    return null;
  }

  const nextLists = [...lists];
  nextLists[listIndex] = {
    ...nextLists[listIndex],
    items,
  };
  writeStore(nextLists);
  return items;
}

function writeStoreListTitle(listId: string, title: string): List | null {
  const lists = getStoreLists();
  const listIndex = lists.findIndex((list) => list.id === listId);
  if (listIndex === -1) {
    return null;
  }

  const nextLists = [...lists];
  nextLists[listIndex] = {
    ...nextLists[listIndex],
    title,
  };
  writeStore(nextLists);
  return nextLists[listIndex];
}

function removeNodeFromTree(items: ItemNode[], id: string): [ItemNode[], boolean] {
  let changed = false;
  const result: ItemNode[] = [];

  for (const item of items) {
    if (item.id === id) {
      changed = true;
      continue;
    }

    const [children, childChanged] = removeNodeFromTree(item.children, id);
    if (childChanged) {
      changed = true;
      result.push({ ...item, children });
      continue;
    }

    result.push(item);
  }

  return [result, changed];
}

export function getLists(): List[] {
  return getStoreLists();
}

export function getListById(listId: string): List | undefined {
  return getStoreListById(listId);
}

export function getListSummaries(): ListSummary[] {
  return getStoreLists().map((list) => ({ id: list.id, title: list.title }));
}

export function getDefaultListId(): string | undefined {
  return getStoreLists()[0]?.id;
}

export function createList(title = "Sin nombre"): List {
  const newList: List = {
    id: `list-${randomUUID()}`,
    title,
    items: [],
  };

  writeStore([newList, ...getStoreLists()]);
  return newList;
}

export function updateListTitle(listId: string, title: string): List | null {
  const normalizedTitle = title.trim();
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  if (list.title === normalizedTitle) {
    return list;
  }

  return writeStoreListTitle(listId, normalizedTitle);
}

export function getNodeById(listId: string, id: string): ItemNode | undefined {
  const list = getStoreListById(listId);
  if (!list) {
    return undefined;
  }
  return findNode(list.items, id);
}

export function toggleItem(listId: string, id: string, nextCompleted: boolean): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = updateNodeInTree(list.items, id, (node) => {
    if (node.children.length > 0) {
      return setSubtreeCompletion(node, nextCompleted);
    }
    return { ...node, completed: nextCompleted };
  });

  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export function completeParent(listId: string, id: string): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, true));
  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export function uncheckParent(listId: string, id: string): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, false));
  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export function resetCompletedItems(listId: string): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = list.items.map((item) => setSubtreeCompletion(item, false));
  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export function createItem(listId: string, title: string, parentId?: string): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const newItem: ItemNode = {
    id: `item-${randomUUID()}`,
    title,
    completed: false,
    children: [],
  };

  const items = list.items;

  if (!parentId) {
    const normalized = normalizeTree([newItem, ...items]);
    return writeStoreListItems(listId, normalized);
  }

  const updated = updateNodeInTree(items, parentId, (node) => ({
    ...node,
    children: [newItem, ...node.children],
  }));

  if (updated === items) {
    return null;
  }

  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export function deleteItem(listId: string, id: string): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const [updated, changed] = removeNodeFromTree(list.items, id);
  if (!changed) {
    return null;
  }

  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export function updateItemTitle(listId: string, id: string, title: string): ItemNode[] | null {
  const list = getStoreListById(listId);
  if (!list) {
    return null;
  }

  const items = list.items;
  const updated = updateNodeInTree(items, id, (node) => ({
    ...node,
    title,
  }));

  if (updated === items) {
    return null;
  }

  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}
