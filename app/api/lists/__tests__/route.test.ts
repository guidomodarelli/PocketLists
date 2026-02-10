/** @jest-environment node */

import { GET } from "../route";

const getListsMock = jest.fn();

jest.mock("@/app/features/lists/services", () => ({
  getLists: () => getListsMock(),
}));

describe("GET /api/lists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("responde 200 con items cuando no hay query params", async () => {
    getListsMock.mockReturnValue([{ id: "1", title: "A", completed: false, children: [] }]);
    const request = new Request("http://localhost:3000/api/lists");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [{ id: "1", title: "A", completed: false, children: [] }],
    });
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
});
