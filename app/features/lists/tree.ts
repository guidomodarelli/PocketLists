import type { ItemNode, ParentOption, TreeMode, VisibleNode } from "./types";

function hasCompletedDescendant(node: ItemNode): boolean {
  for (const child of node.children) {
    if (child.completed || hasCompletedDescendant(child)) {
      return true;
    }
  }
  return false;
}

function hasPendingDescendant(node: ItemNode): boolean {
  for (const child of node.children) {
    if (!child.completed || hasPendingDescendant(child)) {
      return true;
    }
  }
  return false;
}

function isNodePartiallyCompleted(node: ItemNode): boolean {
  if (node.children.length === 0) {
    return false;
  }
  return hasCompletedDescendant(node) && hasPendingDescendant(node);
}

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

export function buildVisibleNode(node: ItemNode, mode: TreeMode): VisibleNode | null {
  const children = node.children
    .map((child) => buildVisibleNode(child, mode))
    .filter((child): child is VisibleNode => child !== null);
  const isPartiallyCompleted = isNodePartiallyCompleted(node);

  if (mode === "pending") {
    if (node.completed && children.length === 0) {
      return null;
    }
    return {
      id: node.id,
      title: node.title,
      completed: node.completed,
      isPartiallyCompleted,
      children,
      isContextOnly: node.completed,
    };
  }

  if (!node.completed && children.length === 0) {
    return null;
  }

  return {
    id: node.id,
    title: node.title,
    completed: node.completed,
    isPartiallyCompleted,
    children,
    isContextOnly: !node.completed,
  };
}

export function buildVisibleTree(items: ItemNode[], mode: TreeMode): VisibleNode[] {
  return items
    .map((item) => buildVisibleNode(item, mode))
    .filter((item): item is VisibleNode => item !== null);
}

export function countByStatus(items: ItemNode[], completed: boolean): number {
  return items.reduce((total, item) => {
    const own = item.completed === completed ? 1 : 0;
    return total + own + countByStatus(item.children, completed);
  }, 0);
}

export function buildParentOptions(items: ItemNode[]): ParentOption[] {
  const options: ParentOption[] = [];

  const walk = (node: ItemNode, path: string[]) => {
    const label = [...path, node.title].join(" / ");
    options.push({ id: node.id, label });
    node.children.forEach((child) => walk(child, [...path, node.title]));
  };

  items.forEach((item) => walk(item, []));
  return options;
}
