import type { ItemNode } from "../../domain/entities/ItemNode";

export type ItemRecord = {
  id: string;
  listId: string;
  parentId: string | null;
  title: string;
  completed: boolean;
  position: number;
};

export function flattenTreeToRecords(listId: string, items: ItemNode[]): ItemRecord[] {
  const records: ItemRecord[] = [];

  const walk = (nodes: ItemNode[], parentId: string | null) => {
    nodes.forEach((node, index) => {
      records.push({
        id: node.id,
        listId,
        parentId,
        title: node.title,
        completed: node.completed,
        position: index,
      });

      if (node.children.length > 0) {
        walk(node.children, node.id);
      }
    });
  };

  walk(items, null);
  return records;
}

export function buildTreeFromRecords(records: ItemRecord[]): ItemNode[] {
  const byParent = new Map<string | null, ItemRecord[]>();

  for (const record of records) {
    const current = byParent.get(record.parentId) ?? [];
    current.push(record);
    byParent.set(record.parentId, current);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.position - b.position);
  }

  const build = (parentId: string | null): ItemNode[] =>
    (byParent.get(parentId) ?? []).map((record) => ({
      id: record.id,
      title: record.title,
      completed: record.completed,
      children: build(record.id),
    }));

  return build(null);
}
