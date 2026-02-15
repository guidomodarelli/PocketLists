import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getTursoDb } from "@/lib/db/client";
import { listsStoreTable } from "@/lib/db/schema";
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

const STORE_RECORD_ID = "lists-store";

async function ensureStoreTable(): Promise<void> {
  const db = getTursoDb();
  if (!db) {
    return;
  }

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS lists_store (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

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

function parseStorePayload(payload: string): ListsStore | null {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("lists" in parsed) ||
      !Array.isArray((parsed as { lists?: unknown }).lists)
    ) {
      return null;
    }

    const lists = (parsed as { lists: List[] }).lists;
    return { lists: normalizeListsStore(lists) };
  } catch {
    return null;
  }
}

async function readStoreFromTurso(): Promise<ListsStore | null> {
  const db = getTursoDb();
  if (!db) {
    return null;
  }

  await ensureStoreTable();

  const rows = await db
    .select({
      data: listsStoreTable.data,
    })
    .from(listsStoreTable)
    .where(eq(listsStoreTable.id, STORE_RECORD_ID))
    .limit(1);

  const persistedData = rows[0]?.data;
  if (!persistedData) {
    return null;
  }

  return parseStorePayload(persistedData);
}

async function writeStoreToTurso(store: ListsStore): Promise<void> {
  const db = getTursoDb();
  if (!db) {
    return;
  }

  await ensureStoreTable();

  const serializedStore = JSON.stringify(store);
  const updatedAt = new Date().toISOString();
  await db
    .insert(listsStoreTable)
    .values({
      id: STORE_RECORD_ID,
      data: serializedStore,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: listsStoreTable.id,
      set: {
        data: serializedStore,
        updatedAt,
      },
    });
}

async function readStore(): Promise<ListsStore> {
  const tursoStore = await readStoreFromTurso();
  if (tursoStore) {
    globalStore.__pocketListsStore = tursoStore;
    return tursoStore;
  }

  const currentStore = globalStore.__pocketListsStore;

  if (!currentStore) {
    const nextStore: ListsStore = { lists: buildInitialLists() };
    globalStore.__pocketListsStore = nextStore;
    await writeStoreToTurso(nextStore);
    return nextStore;
  }

  if ("lists" in currentStore && Array.isArray(currentStore.lists)) {
    const nextStore: ListsStore = { lists: normalizeListsStore(currentStore.lists) };
    globalStore.__pocketListsStore = nextStore;
    await writeStoreToTurso(nextStore);
    return nextStore;
  }

  if ("items" in currentStore && Array.isArray(currentStore.items)) {
    const nextStore = migrateLegacyStore(currentStore.items);
    globalStore.__pocketListsStore = nextStore;
    await writeStoreToTurso(nextStore);
    return nextStore;
  }

  const fallbackStore: ListsStore = { lists: buildInitialLists() };
  globalStore.__pocketListsStore = fallbackStore;
  await writeStoreToTurso(fallbackStore);
  return fallbackStore;
}

async function writeStore(lists: List[]): Promise<void> {
  const nextStore: ListsStore = { lists };
  globalStore.__pocketListsStore = nextStore;
  await writeStoreToTurso(nextStore);
}

async function getStoreLists(): Promise<List[]> {
  return (await readStore()).lists;
}

async function getStoreListById(listId: string): Promise<List | undefined> {
  const lists = await getStoreLists();
  return lists.find((list) => list.id === listId);
}

async function writeStoreListItems(listId: string, items: ItemNode[]): Promise<ItemNode[] | null> {
  const lists = await getStoreLists();
  const listIndex = lists.findIndex((list) => list.id === listId);
  if (listIndex === -1) {
    return null;
  }

  const nextLists = [...lists];
  nextLists[listIndex] = {
    ...nextLists[listIndex],
    items,
  };
  await writeStore(nextLists);
  return items;
}

async function writeStoreListTitle(listId: string, title: string): Promise<List | null> {
  const lists = await getStoreLists();
  const listIndex = lists.findIndex((list) => list.id === listId);
  if (listIndex === -1) {
    return null;
  }

  const nextLists = [...lists];
  nextLists[listIndex] = {
    ...nextLists[listIndex],
    title,
  };
  await writeStore(nextLists);
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

export async function getLists(): Promise<List[]> {
  return getStoreLists();
}

export async function getListById(listId: string): Promise<List | undefined> {
  return getStoreListById(listId);
}

export async function getListSummaries(): Promise<ListSummary[]> {
  return (await getStoreLists()).map((list) => ({ id: list.id, title: list.title }));
}

export async function getDefaultListId(): Promise<string | undefined> {
  return (await getStoreLists())[0]?.id;
}

export async function createList(title = "Sin nombre"): Promise<List> {
  const newList: List = {
    id: `list-${randomUUID()}`,
    title,
    items: [],
  };

  const lists = await getStoreLists();
  await writeStore([newList, ...lists]);
  return newList;
}

export async function deleteList(listId: string): Promise<boolean> {
  const lists = await getStoreLists();
  const nextLists = lists.filter((list) => list.id !== listId);

  if (nextLists.length === lists.length) {
    return false;
  }

  await writeStore(nextLists);
  return true;
}

export async function updateListTitle(listId: string, title: string): Promise<List | null> {
  const normalizedTitle = title.trim();
  const list = await getStoreListById(listId);
  if (!list) {
    return null;
  }

  if (list.title === normalizedTitle) {
    return list;
  }

  return writeStoreListTitle(listId, normalizedTitle);
}

export async function getNodeById(listId: string, id: string): Promise<ItemNode | undefined> {
  const list = await getStoreListById(listId);
  if (!list) {
    return undefined;
  }
  return findNode(list.items, id);
}

export async function toggleItem(
  listId: string,
  id: string,
  nextCompleted: boolean
): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
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

export async function completeParent(listId: string, id: string): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, true));
  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export async function uncheckParent(listId: string, id: string): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, false));
  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export async function resetCompletedItems(listId: string): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
  if (!list) {
    return null;
  }

  const updated = list.items.map((item) => setSubtreeCompletion(item, false));
  const normalized = normalizeTree(updated);
  return writeStoreListItems(listId, normalized);
}

export async function createItem(listId: string, title: string, parentId?: string): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
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

export async function deleteItem(listId: string, id: string): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
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

export async function updateItemTitle(
  listId: string,
  id: string,
  title: string
): Promise<ItemNode[] | null> {
  const list = await getStoreListById(listId);
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
