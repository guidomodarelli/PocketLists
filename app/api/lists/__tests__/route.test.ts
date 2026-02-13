/** @jest-environment node */

import { GET } from "../route";

const getDefaultListIdMock = jest.fn();
const getListByIdMock = jest.fn();
const getListSummariesMock = jest.fn();

jest.mock("@/app/features/lists/services", () => ({
  getDefaultListId: () => getDefaultListIdMock(),
  getListById: (...args: unknown[]) => getListByIdMock(...args),
  getListSummaries: () => getListSummariesMock(),
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
