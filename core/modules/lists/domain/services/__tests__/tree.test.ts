import {
  findNode,
  normalizeTree,
  removeNodeFromTree,
  setSubtreeCompletion,
  updateNodeInTree,
} from "../tree";
import type { ItemNode } from "../../entities/ItemNode";

function createTree(): ItemNode[] {
  return [
    {
      id: "parent",
      title: "Parent",
      completed: false,
      children: [
        { id: "child-a", title: "Child A", completed: true, children: [] },
        { id: "child-b", title: "Child B", completed: true, children: [] },
      ],
    },
  ];
}

describe("core lists tree domain service", () => {
  test("normalizeTree recalcula estado del padre según hijos", () => {
    const normalized = normalizeTree(createTree());
    expect(normalized[0]?.completed).toBe(true);
  });

  test("setSubtreeCompletion aplica estado en todo el subárbol", () => {
    const updated = setSubtreeCompletion(createTree()[0]!, false);
    expect(updated.completed).toBe(false);
    expect(updated.children.every((child) => child.completed === false)).toBe(true);
  });

  test("updateNodeInTree actualiza un nodo hoja sin tocar estructura", () => {
    const updated = updateNodeInTree(createTree(), "child-a", (node) => ({ ...node, title: "Nuevo título" }));
    expect(findNode(updated, "child-a")?.title).toBe("Nuevo título");
  });

  test("removeNodeFromTree elimina parent y descendientes", () => {
    const [updated, changed] = removeNodeFromTree(createTree(), "parent");
    expect(changed).toBe(true);
    expect(updated).toEqual([]);
  });
});
