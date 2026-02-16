import type { ItemNode } from "../entities/ItemNode";

export function normalizeNode(node: ItemNode): ItemNode {
  const children = node.children.map(normalizeNode);
  if (children.length === 0) {
    return { ...node, children };
  }

  const completed = children.every((child) => child.completed);
  return { ...node, completed, children };
}

export function normalizeTree(items: ItemNode[]): ItemNode[] {
  return items.map(normalizeNode);
}

export function setSubtreeCompletion(node: ItemNode, completed: boolean): ItemNode {
  return {
    ...node,
    completed,
    children: node.children.map((child) => setSubtreeCompletion(child, completed)),
  };
}

export function updateNodeRecursive(
  node: ItemNode,
  id: string,
  updater: (node: ItemNode) => ItemNode
): [ItemNode, boolean] {
  if (node.id === id) {
    return [updater(node), true];
  }

  let childChanged = false;
  const children = node.children.map((child) => {
    const [updatedChild, changed] = updateNodeRecursive(child, id, updater);
    if (changed) {
      childChanged = true;
    }
    return updatedChild;
  });

  if (!childChanged) {
    return [node, false];
  }

  return [{ ...node, children }, true];
}

export function updateNodeInTree(
  items: ItemNode[],
  id: string,
  updater: (node: ItemNode) => ItemNode
): ItemNode[] {
  let changed = false;
  const updated = items.map((item) => {
    const [nextItem, itemChanged] = updateNodeRecursive(item, id, updater);
    if (itemChanged) {
      changed = true;
    }
    return nextItem;
  });
  return changed ? updated : items;
}

export function findNode(items: ItemNode[], id: string): ItemNode | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    const foundInChildren = findNode(item.children, id);
    if (foundInChildren) {
      return foundInChildren;
    }
  }
  return undefined;
}

export function removeNodeFromTree(items: ItemNode[], id: string): [ItemNode[], boolean] {
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
