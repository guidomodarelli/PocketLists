/** @jest-environment node */

import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resetTursoClientForTests } from "@/lib/db/client";
import type * as ServicesModule from "../services";

const TEST_TURSO_DB_PATH = join(tmpdir(), `pocket-lists-turso-${process.pid}.db`);
const TEST_TURSO_DB_COMPANION_FILES = [`${TEST_TURSO_DB_PATH}-wal`, `${TEST_TURSO_DB_PATH}-shm`];
process.env.TURSO_DATABASE_URL = `file:${TEST_TURSO_DB_PATH}`;
delete process.env.TURSO_AUTH_TOKEN;

let completeParent: typeof ServicesModule.completeParent;
let createList: typeof ServicesModule.createList;
let createItem: typeof ServicesModule.createItem;
let deleteList: typeof ServicesModule.deleteList;
let deleteItem: typeof ServicesModule.deleteItem;
let getDefaultListId: typeof ServicesModule.getDefaultListId;
let getListById: typeof ServicesModule.getListById;
let getListSummaries: typeof ServicesModule.getListSummaries;
let getLists: typeof ServicesModule.getLists;
let getNodeById: typeof ServicesModule.getNodeById;
let resetCompletedItems: typeof ServicesModule.resetCompletedItems;
let toggleItem: typeof ServicesModule.toggleItem;
let uncheckParent: typeof ServicesModule.uncheckParent;
let updateListTitle: typeof ServicesModule.updateListTitle;
let updateItemTitle: typeof ServicesModule.updateItemTitle;

function removeFileIfExists(path: string) {
  if (!existsSync(path)) {
    return;
  }
  unlinkSync(path);
}

function resetTestDb() {
  resetTursoClientForTests();
  removeFileIfExists(TEST_TURSO_DB_PATH);
  TEST_TURSO_DB_COMPANION_FILES.forEach(removeFileIfExists);
}

const DEFAULT_LIST_ID = "list-travel";

describe("services", () => {
  beforeEach(async () => {
    resetTestDb();
    jest.resetModules();

    const services = await import("../services");
    completeParent = services.completeParent;
    createList = services.createList;
    createItem = services.createItem;
    deleteList = services.deleteList;
    deleteItem = services.deleteItem;
    getDefaultListId = services.getDefaultListId;
    getListById = services.getListById;
    getListSummaries = services.getListSummaries;
    getLists = services.getLists;
    getNodeById = services.getNodeById;
    resetCompletedItems = services.resetCompletedItems;
    toggleItem = services.toggleItem;
    uncheckParent = services.uncheckParent;
    updateListTitle = services.updateListTitle;
    updateItemTitle = services.updateItemTitle;
  });

  test("getLists inicializa y normaliza el árbol", async () => {
    const lists = await getLists();
    const clothing = lists[0]?.items.find((item) => item.id === "clothing");

    expect(lists.length).toBeGreaterThan(0);
    expect(clothing?.completed).toBe(true);
  });

  test("getDefaultListId devuelve el id de la primera lista", async () => {
    expect(await getDefaultListId()).toBe(DEFAULT_LIST_ID);
  });

  test("getListById devuelve undefined para listas inexistentes", async () => {
    expect(await getListById("missing-list")).toBeUndefined();
  });

  test("getListSummaries expone id y title de todas las listas", async () => {
    expect(await getListSummaries()).toEqual([{ id: DEFAULT_LIST_ID, title: "Lista de viaje" }]);
  });

  test("createList agrega una nueva lista al inicio", async () => {
    const created = await createList();
    const summaries = await getListSummaries();

    expect(created.title).toBe("Sin nombre");
    expect(created.id.startsWith("list-")).toBe(true);
    expect(summaries[0]?.id).toBe(created.id);
  });

  test("preserva cambios al reiniciar el cliente de base de datos", async () => {
    const created = await createItem(DEFAULT_LIST_ID, "Persisted item");
    expect(created).not.toBeNull();
    expect(existsSync(TEST_TURSO_DB_PATH)).toBe(true);

    resetTursoClientForTests();

    const persistedNode = (await getLists())
      .flatMap((list) => list.items)
      .find((item) => item.title === "Persisted item");
    expect(persistedNode).toBeDefined();
  });

  test("deleteList elimina una lista existente", async () => {
    const created = await createList("Lista temporal");
    const deleted = await deleteList(created.id);

    expect(deleted).toBe(true);
    expect(await getListById(created.id)).toBeUndefined();
  });

  test("deleteList retorna false para listas inexistentes", async () => {
    expect(await deleteList("missing-list")).toBe(false);
  });

  test("updateListTitle actualiza el nombre de una lista existente", async () => {
    const updatedList = await updateListTitle(DEFAULT_LIST_ID, "Lista renombrada");

    expect(updatedList).not.toBeNull();
    expect(updatedList?.title).toBe("Lista renombrada");
    expect((await getListById(DEFAULT_LIST_ID))?.title).toBe("Lista renombrada");
  });

  test("updateListTitle retorna null cuando la lista no existe", async () => {
    expect(await updateListTitle("missing-list", "Nuevo nombre")).toBeNull();
  });

  test("updateListTitle permite guardar título vacío", async () => {
    const updatedList = await updateListTitle(DEFAULT_LIST_ID, "   ");

    expect(updatedList).not.toBeNull();
    expect(updatedList?.title).toBe("");
    expect((await getListById(DEFAULT_LIST_ID))?.title).toBe("");
  });

  test("usa únicamente datos relacionales por defecto", async () => {
    expect(await getDefaultListId()).toBe(DEFAULT_LIST_ID);
    expect(await getNodeById(DEFAULT_LIST_ID, "unknown-root")).toBeUndefined();
  });

  test("getNodeById devuelve undefined para ids inexistentes", async () => {
    expect(await getNodeById(DEFAULT_LIST_ID, "missing")).toBeUndefined();
  });

  test("toggleItem actualiza hoja simple", async () => {
    const updated = await toggleItem(DEFAULT_LIST_ID, "book", true);
    const node = updated?.find((item) => item.id === "entertainment")?.children.find((c) => c.id === "book");

    expect(node?.completed).toBe(true);
  });

  test("toggleItem sobre padre completa todo su subárbol", async () => {
    const updated = await toggleItem(DEFAULT_LIST_ID, "entertainment", true);
    const entertainment = updated?.find((item) => item.id === "entertainment");

    expect(entertainment?.completed).toBe(true);
    expect(entertainment?.children.every((child) => child.completed)).toBe(true);
  });

  test("completeParent completa padre y descendientes", async () => {
    const updated = await completeParent(DEFAULT_LIST_ID, "travel-day");
    const parent = updated?.find((item) => item.id === "travel-day");

    expect(parent?.completed).toBe(true);
    expect(parent?.children.every((child) => child.completed)).toBe(true);
  });

  test("uncheckParent desmarca padre y descendientes", async () => {
    await completeParent(DEFAULT_LIST_ID, "travel-day");
    const updated = await uncheckParent(DEFAULT_LIST_ID, "travel-day");
    const parent = updated?.find((item) => item.id === "travel-day");

    expect(parent?.completed).toBe(false);
    expect(parent?.children.every((child) => !child.completed)).toBe(true);
  });

  test("resetCompletedItems desmarca todo el árbol", async () => {
    await completeParent(DEFAULT_LIST_ID, "clothing");
    const updated = await resetCompletedItems(DEFAULT_LIST_ID);

    const hasCompleted = JSON.stringify(updated).includes('"completed":true');
    expect(hasCompleted).toBe(false);
  });

  test("createItem agrega item raíz cuando no hay parentId", async () => {
    const updated = await createItem(DEFAULT_LIST_ID, "Nuevo item raíz");
    const list = await getListById(DEFAULT_LIST_ID);
    const newRoot = list?.items.find((item) => item.title === "Nuevo item raíz");

    expect(updated).not.toBeNull();
    expect(newRoot).toBeDefined();
    expect(newRoot?.id.startsWith("item-")).toBe(true);
    expect(list?.items[0]?.title).toBe("Nuevo item raíz");
  });

  test("createItem agrega item hijo cuando parentId existe", async () => {
    const updated = await createItem(DEFAULT_LIST_ID, "Hijo nuevo", "entertainment");
    const list = await getListById(DEFAULT_LIST_ID);
    const entertainment = list?.items.find((item) => item.id === "entertainment");
    const child = entertainment?.children.find((item) => item.title === "Hijo nuevo");

    expect(updated).not.toBeNull();
    expect(child).toBeDefined();
    expect(child?.completed).toBe(false);
    expect(entertainment?.children[0]?.title).toBe("Hijo nuevo");
  });

  test("createItem retorna null cuando parentId no existe", async () => {
    const result = await createItem(DEFAULT_LIST_ID, "Nodo huérfano", "missing-parent");
    expect(result).toBeNull();
  });

  test("deleteItem elimina una hoja existente", async () => {
    const updated = await deleteItem(DEFAULT_LIST_ID, "book");
    const removed = await getNodeById(DEFAULT_LIST_ID, "book");

    expect(updated).not.toBeNull();
    expect(removed).toBeUndefined();
  });

  test("deleteItem elimina un parent junto a sus descendientes", async () => {
    const updated = await deleteItem(DEFAULT_LIST_ID, "travel-day");

    expect(updated).not.toBeNull();
    expect(await getNodeById(DEFAULT_LIST_ID, "travel-day")).toBeUndefined();
    expect(await getNodeById(DEFAULT_LIST_ID, "hygiene-kit")).toBeUndefined();
    expect(await getNodeById(DEFAULT_LIST_ID, "toothbrush")).toBeUndefined();
  });

  test("deleteItem retorna null cuando el id no existe", async () => {
    const result = await deleteItem(DEFAULT_LIST_ID, "missing-node");
    expect(result).toBeNull();
  });

  test("updateItemTitle actualiza el texto de un ítem existente", async () => {
    const updated = await updateItemTitle(DEFAULT_LIST_ID, "book", "Libro actualizado");
    const node = await getNodeById(DEFAULT_LIST_ID, "book");

    expect(updated).not.toBeNull();
    expect(node?.title).toBe("Libro actualizado");
  });

  test("updateItemTitle retorna null cuando el id no existe", async () => {
    const result = await updateItemTitle(DEFAULT_LIST_ID, "missing-node", "Nuevo título");
    expect(result).toBeNull();
  });

  test("operaciones por ítem devuelven null cuando no existe la lista", async () => {
    expect(await toggleItem("missing-list", "book", true)).toBeNull();
    expect(await completeParent("missing-list", "travel-day")).toBeNull();
    expect(await uncheckParent("missing-list", "travel-day")).toBeNull();
    expect(await resetCompletedItems("missing-list")).toBeNull();
    expect(await createItem("missing-list", "Nuevo")).toBeNull();
    expect(await deleteItem("missing-list", "book")).toBeNull();
    expect(await updateItemTitle("missing-list", "book", "Nuevo título")).toBeNull();
  });
});
