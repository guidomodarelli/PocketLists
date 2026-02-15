/** @jest-environment node */

import { GET, POST } from "../route";

const completeParentMock = jest.fn();
const createListMock = jest.fn();
const createItemMock = jest.fn();
const deleteListMock = jest.fn();
const deleteItemMock = jest.fn();
const getDefaultListIdMock = jest.fn();
const getListByIdMock = jest.fn();
const getListSummariesMock = jest.fn();
const getNodeByIdMock = jest.fn();
const resetCompletedItemsMock = jest.fn();
const toggleItemMock = jest.fn();
const uncheckParentMock = jest.fn();
const updateItemTitleMock = jest.fn();
const updateListTitleMock = jest.fn();

jest.mock("@/app/features/lists/services", () => ({
  completeParent: (...args: unknown[]) => completeParentMock(...args),
  createList: (...args: unknown[]) => createListMock(...args),
  createItem: (...args: unknown[]) => createItemMock(...args),
  deleteList: (...args: unknown[]) => deleteListMock(...args),
  deleteItem: (...args: unknown[]) => deleteItemMock(...args),
  getDefaultListId: () => getDefaultListIdMock(),
  getListById: (...args: unknown[]) => getListByIdMock(...args),
  getListSummaries: () => getListSummariesMock(),
  getNodeById: (...args: unknown[]) => getNodeByIdMock(...args),
  resetCompletedItems: (...args: unknown[]) => resetCompletedItemsMock(...args),
  toggleItem: (...args: unknown[]) => toggleItemMock(...args),
  uncheckParent: (...args: unknown[]) => uncheckParentMock(...args),
  updateItemTitle: (...args: unknown[]) => updateItemTitleMock(...args),
  updateListTitle: (...args: unknown[]) => updateListTitleMock(...args),
}));

describe("GET /api/lists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("responde 200 con items cuando no hay query params", async () => {
    getDefaultListIdMock.mockReturnValue("list-1");
    getListSummariesMock.mockReturnValue([{ id: "list-1", title: "Lista 1" }]);
    getListByIdMock.mockReturnValue({
      id: "list-1",
      title: "Lista 1",
      items: [{ id: "1", title: "A", completed: false, children: [] }],
    });
    const request = new Request("http://localhost:3000/api/lists");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      lists: [{ id: "list-1", title: "Lista 1" }],
      activeList: {
        id: "list-1",
        title: "Lista 1",
        items: [{ id: "1", title: "A", completed: false, children: [] }],
      },
    });
  });

  test("responde 200 cuando se solicita una lista específica con listId", async () => {
    getListSummariesMock.mockReturnValue([{ id: "list-2", title: "Lista 2" }]);
    getListByIdMock.mockReturnValue({
      id: "list-2",
      title: "Lista 2",
      items: [{ id: "a", title: "Nodo", completed: false, children: [] }],
    });

    const request = new Request("http://localhost:3000/api/lists?listId=list-2");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getListByIdMock).toHaveBeenCalledWith("list-2");
  });

  test("responde 400 cuando recibe parámetros no soportados", async () => {
    const request = new Request("http://localhost:3000/api/lists?foo=1&bar=2");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Parámetros de consulta no soportados.");
    expect(body.details).toContain("foo");
    expect(body.details).toContain("bar");
  });

  test("deduplica nombres de parámetros repetidos en el detalle de error", async () => {
    const request = new Request("http://localhost:3000/api/lists?foo=1&foo=2");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details).toBe("Eliminá foo e intentá de nuevo.");
  });

  test("responde 400 cuando listId está vacío", async () => {
    const request = new Request("http://localhost:3000/api/lists?listId=");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Parámetro inválido.");
  });

  test("responde 404 cuando la lista solicitada no existe", async () => {
    getListByIdMock.mockReturnValue(undefined);
    const request = new Request("http://localhost:3000/api/lists?listId=missing");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("No encontramos la lista solicitada.");
  });
});

describe("POST /api/lists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("crea una lista y devuelve redirect al nuevo recurso", async () => {
    createListMock.mockReturnValue({ id: "list-new" });
    const request = new Request("http://localhost:3000/api/lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "createList", payload: {} }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createListMock).toHaveBeenCalledWith("Sin nombre");
    expect(body).toEqual({ redirectTo: "/lists/list-new" });
  });

  test("toggle item persiste cambio y redirige a la lista", async () => {
    getNodeByIdMock.mockReturnValue({
      id: "node-1",
      completed: false,
      children: [],
    });
    toggleItemMock.mockReturnValue(true);
    const request = new Request("http://localhost:3000/api/lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "toggleItem",
        payload: { listId: "list-1", id: "node-1", nextCompleted: "true" },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(toggleItemMock).toHaveBeenCalledWith("list-1", "node-1", true);
    expect(body).toEqual({ redirectTo: "/lists/list-1" });
  });

  test("toggle item solicita confirmación para nodos con hijos", async () => {
    getNodeByIdMock.mockReturnValue({
      id: "parent-1",
      completed: false,
      children: [{ id: "child-1" }],
    });
    const request = new Request("http://localhost:3000/api/lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "toggleItem",
        payload: { listId: "list-1", id: "parent-1", nextCompleted: "true" },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(toggleItemMock).not.toHaveBeenCalled();
    expect(body).toEqual({ redirectTo: "/lists/list-1?confirm=parent-1" });
  });
});
