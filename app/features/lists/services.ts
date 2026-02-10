import { randomUUID } from "node:crypto";
import { INITIAL_ITEMS } from "./data";
import type { ItemNode } from "./types";
import { findNode, normalizeTree, setSubtreeCompletion, updateNodeInTree } from "./tree";

type ListsStore = {
  items: ItemNode[];
};

type GlobalStore = typeof globalThis & {
  __pocketListsStore?: ListsStore;
};

const globalStore = globalThis as GlobalStore;

function readStore(): ListsStore {
  if (!globalStore.__pocketListsStore) {
    globalStore.__pocketListsStore = { items: normalizeTree(INITIAL_ITEMS) };
  }
  return globalStore.__pocketListsStore;
}

function writeStore(items: ItemNode[]): void {
  const store = readStore();
  store.items = items;
}

function getStoreItems(): ItemNode[] {
  return readStore().items;
}

export function getLists(): ItemNode[] {
  return getStoreItems();
}

export function getNodeById(id: string): ItemNode | undefined {
  return findNode(getStoreItems(), id);
}

export function toggleItem(id: string, nextCompleted: boolean): ItemNode[] {
  const updated = updateNodeInTree(getStoreItems(), id, (node) => {
    if (node.children.length > 0) {
      return setSubtreeCompletion(node, nextCompleted);
    }
    return { ...node, completed: nextCompleted };
  });

  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}

export function completeParent(id: string): ItemNode[] {
  const updated = updateNodeInTree(getStoreItems(), id, (node) => setSubtreeCompletion(node, true));
  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}

export function uncheckParent(id: string): ItemNode[] {
  const updated = updateNodeInTree(getStoreItems(), id, (node) => setSubtreeCompletion(node, false));
  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}

export function resetCompletedItems(): ItemNode[] {
  const updated = getStoreItems().map((item) => setSubtreeCompletion(item, false));
  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}

export function createItem(title: string, parentId?: string): ItemNode[] | null {
  const newItem: ItemNode = {
    id: `item-${randomUUID()}`,
    title,
    completed: false,
    children: [],
  };

  const items = getStoreItems();

  if (!parentId) {
    const normalized = normalizeTree([...items, newItem]);
    writeStore(normalized);
    return normalized;
  }

  const updated = updateNodeInTree(items, parentId, (node) => ({
    ...node,
    children: [...node.children, newItem],
  }));

  if (updated === items) {
    return null;
  }

  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}
