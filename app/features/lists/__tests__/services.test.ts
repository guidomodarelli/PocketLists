/** @jest-environment node */

import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  completeParent,
  createList,
  createItem,
  deleteList,
  deleteItem,
  getDefaultListId,
  getListById,
  getListSummaries,
  getLists,
  getNodeById,
  resetCompletedItems,
  toggleItem,
  uncheckParent,
  updateListTitle,
  updateItemTitle,
} from "../services";
import { tmpdir } from "node:os";

type GlobalStore = typeof globalThis & {
  __pocketListsStore?: unknown;
};

const TEST_STORE_PATH = join(tmpdir(), `pocket-lists-store-${process.pid}.json`);
process.env.POCKET_LISTS_STORE_PATH = TEST_STORE_PATH;

function resetStore() {
  delete (globalThis as GlobalStore).__pocketListsStore;
  if (existsSync(TEST_STORE_PATH)) {
    unlinkSync(TEST_STORE_PATH);
  }
}

const DEFAULT_LIST_ID = "list-travel";

describe("services", () => {
  beforeEach(() => {
    resetStore();
  });

  test("getLists inicializa y normaliza el árbol", () => {
    const lists = getLists();
    const clothing = lists[0]?.items.find((item) => item.id === "clothing");

    expect(lists.length).toBeGreaterThan(0);
    expect(clothing?.completed).toBe(true);
  });

  test("getDefaultListId devuelve el id de la primera lista", () => {
    expect(getDefaultListId()).toBe(DEFAULT_LIST_ID);
  });

  test("getListById devuelve undefined para listas inexistentes", () => {
    expect(getListById("missing-list")).toBeUndefined();
  });

  test("getListSummaries expone id y title de todas las listas", () => {
    expect(getListSummaries()).toEqual([{ id: DEFAULT_LIST_ID, title: "Lista de viaje" }]);
  });

  test("createList agrega una nueva lista al inicio", () => {
    const created = createList();
    const summaries = getListSummaries();

    expect(created.title).toBe("Sin nombre");
    expect(created.id.startsWith("list-")).toBe(true);
    expect(summaries[0]?.id).toBe(created.id);
  });

  test("preserva cambios al reiniciar store en memoria", () => {
    const created = createItem(DEFAULT_LIST_ID, "Persisted item");
    expect(created).not.toBeNull();

    delete (globalThis as GlobalStore).__pocketListsStore;

    const persistedNode = getLists()
      .flatMap((list) => list.items)
      .find((item) => item.title === "Persisted item");
    expect(persistedNode).toBeDefined();
  });

  test("deleteList elimina una lista existente", () => {
    const created = createList("Lista temporal");
    const deleted = deleteList(created.id);

    expect(deleted).toBe(true);
    expect(getListById(created.id)).toBeUndefined();
  });

  test("deleteList retorna false para listas inexistentes", () => {
    expect(deleteList("missing-list")).toBe(false);
  });

  test("updateListTitle actualiza el nombre de una lista existente", () => {
    const updatedList = updateListTitle(DEFAULT_LIST_ID, "Lista renombrada");

    expect(updatedList).not.toBeNull();
    expect(updatedList?.title).toBe("Lista renombrada");
    expect(getListById(DEFAULT_LIST_ID)?.title).toBe("Lista renombrada");
  });

  test("updateListTitle retorna null cuando la lista no existe", () => {
    expect(updateListTitle("missing-list", "Nuevo nombre")).toBeNull();
  });

  test("updateListTitle permite guardar título vacío", () => {
    const updatedList = updateListTitle(DEFAULT_LIST_ID, "   ");

    expect(updatedList).not.toBeNull();
    expect(updatedList?.title).toBe("");
    expect(getListById(DEFAULT_LIST_ID)?.title).toBe("");
  });

  test("migra store legacy en memoria con shape { items: [...] }", () => {
    (globalThis as GlobalStore).__pocketListsStore = {
      items: [
        {
          id: "legacy-root",
          title: "Legacy",
          completed: false,
          children: [],
        },
      ],
    };

    expect(getDefaultListId()).toBe(DEFAULT_LIST_ID);
    expect(getNodeById(DEFAULT_LIST_ID, "legacy-root")).toBeDefined();
  });

  test("getNodeById devuelve undefined para ids inexistentes", () => {
    expect(getNodeById(DEFAULT_LIST_ID, "missing")).toBeUndefined();
  });

  test("toggleItem actualiza hoja simple", () => {
    const updated = toggleItem(DEFAULT_LIST_ID, "book", true);
    const node = updated?.find((item) => item.id === "entertainment")?.children.find((c) => c.id === "book");

    expect(node?.completed).toBe(true);
  });

  test("toggleItem sobre padre completa todo su subárbol", () => {
    const updated = toggleItem(DEFAULT_LIST_ID, "entertainment", true);
    const entertainment = updated?.find((item) => item.id === "entertainment");

    expect(entertainment?.completed).toBe(true);
    expect(entertainment?.children.every((child) => child.completed)).toBe(true);
  });

  test("completeParent completa padre y descendientes", () => {
    const updated = completeParent(DEFAULT_LIST_ID, "travel-day");
    const parent = updated?.find((item) => item.id === "travel-day");

    expect(parent?.completed).toBe(true);
    expect(parent?.children.every((child) => child.completed)).toBe(true);
  });

  test("uncheckParent desmarca padre y descendientes", () => {
    completeParent(DEFAULT_LIST_ID, "travel-day");
    const updated = uncheckParent(DEFAULT_LIST_ID, "travel-day");
    const parent = updated?.find((item) => item.id === "travel-day");

    expect(parent?.completed).toBe(false);
    expect(parent?.children.every((child) => !child.completed)).toBe(true);
  });

  test("resetCompletedItems desmarca todo el árbol", () => {
    completeParent(DEFAULT_LIST_ID, "clothing");
    const updated = resetCompletedItems(DEFAULT_LIST_ID);

    const hasCompleted = JSON.stringify(updated).includes('"completed":true');
    expect(hasCompleted).toBe(false);
  });

  test("createItem agrega item raíz cuando no hay parentId", () => {
    const updated = createItem(DEFAULT_LIST_ID, "Nuevo item raíz");
    const newRoot = updated?.find((item) => item.title === "Nuevo item raíz");

    expect(updated).not.toBeNull();
    expect(newRoot).toBeDefined();
    expect(newRoot?.id.startsWith("item-")).toBe(true);
    expect(updated?.[0]?.title).toBe("Nuevo item raíz");
  });

  test("createItem agrega item hijo cuando parentId existe", () => {
    const updated = createItem(DEFAULT_LIST_ID, "Hijo nuevo", "entertainment");
    const entertainment = updated?.find((item) => item.id === "entertainment");
    const child = entertainment?.children.find((item) => item.title === "Hijo nuevo");

    expect(updated).not.toBeNull();
    expect(child).toBeDefined();
    expect(child?.completed).toBe(false);
    expect(entertainment?.children[0]?.title).toBe("Hijo nuevo");
  });

  test("createItem retorna null cuando parentId no existe", () => {
    const result = createItem(DEFAULT_LIST_ID, "Nodo huérfano", "missing-parent");
    expect(result).toBeNull();
  });

  test("deleteItem elimina una hoja existente", () => {
    const updated = deleteItem(DEFAULT_LIST_ID, "book");
    const removed = getNodeById(DEFAULT_LIST_ID, "book");

    expect(updated).not.toBeNull();
    expect(removed).toBeUndefined();
  });

  test("deleteItem elimina un parent junto a sus descendientes", () => {
    const updated = deleteItem(DEFAULT_LIST_ID, "travel-day");

    expect(updated).not.toBeNull();
    expect(getNodeById(DEFAULT_LIST_ID, "travel-day")).toBeUndefined();
    expect(getNodeById(DEFAULT_LIST_ID, "hygiene-kit")).toBeUndefined();
    expect(getNodeById(DEFAULT_LIST_ID, "toothbrush")).toBeUndefined();
  });

  test("deleteItem retorna null cuando el id no existe", () => {
    const result = deleteItem(DEFAULT_LIST_ID, "missing-node");
    expect(result).toBeNull();
  });

  test("updateItemTitle actualiza el texto de un ítem existente", () => {
    const updated = updateItemTitle(DEFAULT_LIST_ID, "book", "Libro actualizado");
    const node = getNodeById(DEFAULT_LIST_ID, "book");

    expect(updated).not.toBeNull();
    expect(node?.title).toBe("Libro actualizado");
  });

  test("updateItemTitle retorna null cuando el id no existe", () => {
    const result = updateItemTitle(DEFAULT_LIST_ID, "missing-node", "Nuevo título");
    expect(result).toBeNull();
  });

  test("operaciones por ítem devuelven null cuando no existe la lista", () => {
    expect(toggleItem("missing-list", "book", true)).toBeNull();
    expect(completeParent("missing-list", "travel-day")).toBeNull();
    expect(uncheckParent("missing-list", "travel-day")).toBeNull();
    expect(resetCompletedItems("missing-list")).toBeNull();
    expect(createItem("missing-list", "Nuevo")).toBeNull();
    expect(deleteItem("missing-list", "book")).toBeNull();
    expect(updateItemTitle("missing-list", "book", "Nuevo título")).toBeNull();
  });
});
