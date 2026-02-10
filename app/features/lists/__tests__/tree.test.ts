import type { ItemNode } from "../types";
import {
  buildParentOptions,
  buildVisibleNode,
  buildVisibleTree,
  countByStatus,
  findNode,
  normalizeNode,
  normalizeTree,
  setSubtreeCompletion,
  updateNodeInTree,
} from "../tree";

function createSampleTree(): ItemNode[] {
  return [
    {
      id: "root-a",
      title: "Root A",
      completed: false,
      children: [
        { id: "a-1", title: "A1", completed: true, children: [] },
        { id: "a-2", title: "A2", completed: false, children: [] },
      ],
    },
    {
      id: "root-b",
      title: "Root B",
      completed: false,
      children: [
        {
          id: "b-1",
          title: "B1",
          completed: false,
          children: [{ id: "b-1-1", title: "B11", completed: true, children: [] }],
        },
      ],
    },
  ];
}

describe("tree utilities", () => {
  test("normalizeNode recalcula el estado de un padre según sus hijos", () => {
    const node: ItemNode = {
      id: "parent",
      title: "Parent",
      completed: false,
      children: [
        { id: "child-1", title: "Child 1", completed: true, children: [] },
        { id: "child-2", title: "Child 2", completed: true, children: [] },
      ],
    };

    const normalized = normalizeNode(node);

    expect(normalized.completed).toBe(true);
  });

  test("normalizeTree normaliza todos los niveles", () => {
    const tree = createSampleTree();
    const normalized = normalizeTree(tree);

    expect(normalized[0].completed).toBe(false);
    expect(normalized[1].children[0].completed).toBe(true);
  });

  test("setSubtreeCompletion propaga completion a todos los descendientes", () => {
    const [rootB] = createSampleTree().slice(1);
    const completedSubtree = setSubtreeCompletion(rootB, true);
    const uncheckedSubtree = setSubtreeCompletion(rootB, false);

    expect(completedSubtree.completed).toBe(true);
    expect(completedSubtree.children[0].children[0].completed).toBe(true);
    expect(uncheckedSubtree.completed).toBe(false);
    expect(uncheckedSubtree.children[0].children[0].completed).toBe(false);
  });

  test("updateNodeInTree actualiza un nodo específico", () => {
    const tree = createSampleTree();
    const updated = updateNodeInTree(tree, "a-2", (node) => ({ ...node, completed: true }));

    expect(findNode(updated, "a-2")?.completed).toBe(true);
  });

  test("updateNodeInTree retorna la misma referencia cuando no encuentra el id", () => {
    const tree = createSampleTree();
    const updated = updateNodeInTree(tree, "missing-id", (node) => ({ ...node, completed: true }));

    expect(updated).toBe(tree);
  });

  test("findNode encuentra nodos en niveles anidados y retorna undefined cuando falta", () => {
    const tree = createSampleTree();
    expect(findNode(tree, "b-1-1")?.title).toBe("B11");
    expect(findNode(tree, "not-found")).toBeUndefined();
  });

  test("buildVisibleNode en modo pending excluye hojas completadas", () => {
    const node: ItemNode = {
      id: "leaf",
      title: "Leaf",
      completed: true,
      children: [],
    };

    expect(buildVisibleNode(node, "pending")).toBeNull();
  });

  test("buildVisibleNode marca parcialmente completado cuando corresponde", () => {
    const [rootA] = createSampleTree();
    const visible = buildVisibleNode(rootA, "pending");

    expect(visible).not.toBeNull();
    expect(visible?.isPartiallyCompleted).toBe(true);
  });

  test("buildVisibleNode en modo completed excluye hojas pendientes", () => {
    const node: ItemNode = {
      id: "leaf-pending",
      title: "Leaf pending",
      completed: false,
      children: [],
    };

    expect(buildVisibleNode(node, "completed")).toBeNull();
  });

  test("buildVisibleTree aplica filtro por modo en todos los nodos", () => {
    const tree = normalizeTree(createSampleTree());

    const pendingTree = buildVisibleTree(tree, "pending");
    const completedTree = buildVisibleTree(tree, "completed");

    expect(pendingTree.length).toBeGreaterThan(0);
    expect(completedTree.length).toBeGreaterThan(0);
    expect(completedTree.some((node) => node.isContextOnly)).toBe(true);
  });

  test("countByStatus cuenta recursivamente pendientes y completados", () => {
    const tree = normalizeTree(createSampleTree());

    expect(countByStatus(tree, true)).toBe(4);
    expect(countByStatus(tree, false)).toBe(2);
  });

  test("buildParentOptions arma labels con ruta completa", () => {
    const tree = createSampleTree();
    const options = buildParentOptions(tree);

    expect(options).toEqual(
      expect.arrayContaining([
        { id: "root-a", label: "Root A" },
        { id: "a-1", label: "Root A / A1" },
        { id: "b-1-1", label: "Root B / B1 / B11" },
      ])
    );
  });
});
