import type { ItemNode, List, ListSummary, ListsResponse } from "./types";
import { findNode, normalizeTree, setSubtreeCompletion, updateNodeInTree } from "./tree";

export type ListsMutationAction =
  | "toggleItem"
  | "confirmParent"
  | "confirmUncheckParent"
  | "resetCompleted"
  | "createItem"
  | "deleteItem"
  | "editItemTitle"
  | "createList"
  | "editListTitle"
  | "deleteList";

export type OptimisticPayload = Record<string, string | undefined>;

function parseBoolean(value: string | undefined): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function createTemporaryId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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

function setActiveList(data: ListsResponse, activeList: List): ListsResponse {
  return {
    ...data,
    activeList,
  };
}

function setActiveItems(data: ListsResponse, items: ItemNode[]): ListsResponse {
  return setActiveList(data, {
    ...data.activeList,
    items: normalizeTree(items),
  });
}

function setListSummaries(data: ListsResponse, lists: ListSummary[]): ListsResponse {
  return {
    ...data,
    lists,
  };
}

function updateSummariesTitle(data: ListsResponse, listId: string, title: string): ListsResponse {
  const lists = data.lists.map((list) =>
    list.id === listId
      ? {
          ...list,
          title,
        }
      : list
  );

  const activeList =
    data.activeList.id === listId
      ? {
          ...data.activeList,
          title,
        }
      : data.activeList;

  return {
    ...data,
    lists,
    activeList,
  };
}

function applyToggleItem(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const id = payload.id;
  const nextCompleted = parseBoolean(payload.nextCompleted);
  if (!id || nextCompleted === null) {
    return data;
  }

  const currentNode = findNode(data.activeList.items, id);
  if (!currentNode) {
    return data;
  }

  if (nextCompleted && currentNode.children.length > 0 && !currentNode.completed) {
    return data;
  }

  const updated = updateNodeInTree(data.activeList.items, id, (node) => {
    if (node.children.length > 0) {
      return setSubtreeCompletion(node, nextCompleted);
    }
    return { ...node, completed: nextCompleted };
  });

  if (updated === data.activeList.items) {
    return data;
  }

  return setActiveItems(data, updated);
}

function applyConfirmParent(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const id = payload.id;
  if (!id) {
    return data;
  }

  const updated = updateNodeInTree(data.activeList.items, id, (node) => setSubtreeCompletion(node, true));
  if (updated === data.activeList.items) {
    return data;
  }

  return setActiveItems(data, updated);
}

function applyConfirmUncheckParent(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const id = payload.id;
  if (!id) {
    return data;
  }

  const updated = updateNodeInTree(data.activeList.items, id, (node) => setSubtreeCompletion(node, false));
  if (updated === data.activeList.items) {
    return data;
  }

  return setActiveItems(data, updated);
}

function applyResetCompleted(data: ListsResponse): ListsResponse {
  const updated = data.activeList.items.map((item) => setSubtreeCompletion(item, false));
  return setActiveItems(data, updated);
}

function applyCreateItem(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const title = payload.title?.trim();
  if (!title) {
    return data;
  }

  const parentId = payload.parentId;
  const newItem: ItemNode = {
    id: createTemporaryId("item"),
    title,
    completed: false,
    children: [],
  };

  if (!parentId) {
    return setActiveItems(data, [newItem, ...data.activeList.items]);
  }

  const updated = updateNodeInTree(data.activeList.items, parentId, (node) => ({
    ...node,
    children: [newItem, ...node.children],
  }));

  if (updated === data.activeList.items) {
    return data;
  }

  return setActiveItems(data, updated);
}

function applyDeleteItem(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const id = payload.id;
  if (!id) {
    return data;
  }

  const [updated, changed] = removeNodeFromTree(data.activeList.items, id);
  if (!changed) {
    return data;
  }

  return setActiveItems(data, updated);
}

function applyEditItemTitle(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const id = payload.id;
  const title = payload.title?.trim();
  if (!id || !title) {
    return data;
  }

  const updated = updateNodeInTree(data.activeList.items, id, (node) => ({
    ...node,
    title,
  }));
  if (updated === data.activeList.items) {
    return data;
  }

  return setActiveItems(data, updated);
}

function applyCreateList(data: ListsResponse): ListsResponse {
  const newList: ListSummary = {
    id: createTemporaryId("list"),
    title: "Sin nombre",
  };

  return setListSummaries(data, [newList, ...data.lists]);
}

function applyEditListTitle(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const listId = payload.listId;
  const title = payload.title?.trim();
  if (!listId || title === undefined) {
    return data;
  }

  return updateSummariesTitle(data, listId, title);
}

function applyDeleteList(data: ListsResponse, payload: OptimisticPayload): ListsResponse {
  const listId = payload.listId;
  if (!listId) {
    return data;
  }

  const nextLists = data.lists.filter((list) => list.id !== listId);
  if (nextLists.length === data.lists.length) {
    return data;
  }

  if (data.activeList.id !== listId) {
    return setListSummaries(data, nextLists);
  }

  const fallbackListSummary = nextLists[0];
  const fallbackList: List = fallbackListSummary
    ? {
        id: fallbackListSummary.id,
        title: fallbackListSummary.title,
        items: [],
      }
    : {
        id: createTemporaryId("list"),
        title: "Sin nombre",
        items: [],
      };

  return {
    ...data,
    lists: nextLists,
    activeList: fallbackList,
  };
}

export function applyOptimisticMutation(
  data: ListsResponse,
  action: ListsMutationAction,
  payload: OptimisticPayload
): ListsResponse {
  if (action === "toggleItem") {
    return applyToggleItem(data, payload);
  }
  if (action === "confirmParent") {
    return applyConfirmParent(data, payload);
  }
  if (action === "confirmUncheckParent") {
    return applyConfirmUncheckParent(data, payload);
  }
  if (action === "resetCompleted") {
    return applyResetCompleted(data);
  }
  if (action === "createItem") {
    return applyCreateItem(data, payload);
  }
  if (action === "deleteItem") {
    return applyDeleteItem(data, payload);
  }
  if (action === "editItemTitle") {
    return applyEditItemTitle(data, payload);
  }
  if (action === "createList") {
    return applyCreateList(data);
  }
  if (action === "editListTitle") {
    return applyEditListTitle(data, payload);
  }
  if (action === "deleteList") {
    return applyDeleteList(data, payload);
  }

  return data;
}
