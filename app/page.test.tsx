import Home from "./page";
import * as services from "@/app/features/lists/services";

const redirectMock = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

jest.mock("@/app/features/lists/services", () => ({
  createList: jest.fn(),
  getDefaultListId: jest.fn(),
}));

const servicesMock = jest.mocked(services);

describe("Root page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirige a la lista por defecto cuando existe", () => {
    servicesMock.getDefaultListId.mockReturnValue("list-default");

    expect(() => Home()).toThrow("NEXT_REDIRECT:/lists/list-default");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-default");
    expect(servicesMock.createList).not.toHaveBeenCalled();
  });

  test("crea una lista sin nombre cuando no hay listas y redirige", () => {
    servicesMock.getDefaultListId.mockReturnValue(undefined);
    servicesMock.createList.mockReturnValue({ id: "list-new", title: "Sin nombre", items: [] });

    expect(() => Home()).toThrow("NEXT_REDIRECT:/lists/list-new");
    expect(servicesMock.createList).toHaveBeenCalledWith("Sin nombre");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-new");
  });
});
