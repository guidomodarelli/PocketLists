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
    const normalized = normalizeTree([newItem, ...items]);
    writeStore(normalized);
    return normalized;
  }

  const updated = updateNodeInTree(items, parentId, (node) => ({
    ...node,
    children: [newItem, ...node.children],
  }));

  if (updated === items) {
    return null;
  }

  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}

export function deleteItem(id: string): ItemNode[] | null {
  const [updated, changed] = removeNodeFromTree(getStoreItems(), id);
  if (!changed) {
    return null;
  }

  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}

export function updateItemTitle(id: string, title: string): ItemNode[] | null {
  const items = getStoreItems();
  const updated = updateNodeInTree(items, id, (node) => ({
    ...node,
    title,
  }));

  if (updated === items) {
    return null;
  }

  const normalized = normalizeTree(updated);
  writeStore(normalized);
  return normalized;
}
