import {
  completeParent,
  createItem,
  deleteItem,
  getLists,
  getNodeById,
  resetCompletedItems,
  toggleItem,
  uncheckParent,
} from "../services";

type GlobalStore = typeof globalThis & {
  __pocketListsStore?: unknown;
};

function resetStore() {
  delete (globalThis as GlobalStore).__pocketListsStore;
}

describe("services", () => {
  beforeEach(() => {
    resetStore();
  });

  test("getLists inicializa y normaliza el árbol", () => {
    const items = getLists();
    const clothing = items.find((item) => item.id === "clothing");

    expect(items.length).toBeGreaterThan(0);
    expect(clothing?.completed).toBe(true);
  });

  test("getNodeById devuelve undefined para ids inexistentes", () => {
    expect(getNodeById("missing")).toBeUndefined();
  });

  test("toggleItem actualiza hoja simple", () => {
    const updated = toggleItem("book", true);
    const node = updated.find((item) => item.id === "entertainment")?.children.find((c) => c.id === "book");

    expect(node?.completed).toBe(true);
  });

  test("toggleItem sobre padre completa todo su subárbol", () => {
    const updated = toggleItem("entertainment", true);
    const entertainment = updated.find((item) => item.id === "entertainment");

    expect(entertainment?.completed).toBe(true);
    expect(entertainment?.children.every((child) => child.completed)).toBe(true);
  });

  test("completeParent completa padre y descendientes", () => {
    const updated = completeParent("travel-day");
    const parent = updated.find((item) => item.id === "travel-day");

    expect(parent?.completed).toBe(true);
    expect(parent?.children.every((child) => child.completed)).toBe(true);
  });

  test("uncheckParent desmarca padre y descendientes", () => {
    completeParent("travel-day");
    const updated = uncheckParent("travel-day");
    const parent = updated.find((item) => item.id === "travel-day");

    expect(parent?.completed).toBe(false);
    expect(parent?.children.every((child) => !child.completed)).toBe(true);
  });

  test("resetCompletedItems desmarca todo el árbol", () => {
    completeParent("clothing");
    const updated = resetCompletedItems();

    const hasCompleted = JSON.stringify(updated).includes('"completed":true');
    expect(hasCompleted).toBe(false);
  });

  test("createItem agrega item raíz cuando no hay parentId", () => {
    const updated = createItem("Nuevo item raíz");
    const newRoot = updated?.find((item) => item.title === "Nuevo item raíz");

    expect(updated).not.toBeNull();
    expect(newRoot).toBeDefined();
    expect(newRoot?.id.startsWith("item-")).toBe(true);
  });

  test("createItem agrega item hijo cuando parentId existe", () => {
    const updated = createItem("Hijo nuevo", "entertainment");
    const entertainment = updated?.find((item) => item.id === "entertainment");
    const child = entertainment?.children.find((item) => item.title === "Hijo nuevo");

    expect(updated).not.toBeNull();
    expect(child).toBeDefined();
    expect(child?.completed).toBe(false);
  });

  test("createItem retorna null cuando parentId no existe", () => {
    const result = createItem("Nodo huérfano", "missing-parent");
    expect(result).toBeNull();
  });

  test("deleteItem elimina una hoja existente", () => {
    const updated = deleteItem("book");
    const removed = getNodeById("book");

    expect(updated).not.toBeNull();
    expect(removed).toBeUndefined();
  });

  test("deleteItem elimina un parent junto a sus descendientes", () => {
    const updated = deleteItem("travel-day");

    expect(updated).not.toBeNull();
    expect(getNodeById("travel-day")).toBeUndefined();
    expect(getNodeById("hygiene-kit")).toBeUndefined();
    expect(getNodeById("toothbrush")).toBeUndefined();
  });

  test("deleteItem retorna null cuando el id no existe", () => {
    const result = deleteItem("missing-node");
    expect(result).toBeNull();
  });
});
