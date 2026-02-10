import {
  confirmParentAction,
  confirmUncheckParentAction,
  createItemAction,
  deleteItemAction,
  resetCompletedAction,
  toggleItemAction,
} from "../actions";
import * as services from "../services";

const revalidateTagMock = jest.fn();
const redirectMock = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

jest.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

jest.mock("../services", () => ({
  completeParent: jest.fn(),
  createItem: jest.fn(),
  deleteItem: jest.fn(),
  getNodeById: jest.fn(),
  resetCompletedItems: jest.fn(),
  toggleItem: jest.fn(),
  uncheckParent: jest.fn(),
}));

const servicesMock = jest.mocked(services);

function createFormData(entries: Record<string, string>) {
  const data = new FormData();
  Object.entries(entries).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("toggleItemAction: falta id requerido", async () => {
    await expect(toggleItemAction(createFormData({ nextCompleted: "true" }))).rejects.toThrow(
      'Falta el campo requerido "id".'
    );
  });

  test("toggleItemAction: valor boolean inválido", async () => {
    await expect(toggleItemAction(createFormData({ id: "abc", nextCompleted: "invalid" }))).rejects.toThrow(
      'Valor inválido para "nextCompleted".'
    );
  });

  test("toggleItemAction: redirige a error cuando no existe el nodo", async () => {
    servicesMock.getNodeById.mockReturnValue(undefined);

    await expect(toggleItemAction(createFormData({ id: "missing", nextCompleted: "true" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?error=action"
    );
    expect(redirectMock).toHaveBeenCalledWith("/?error=action");
  });

  test("toggleItemAction: redirige a confirm para padre no completado", async () => {
    servicesMock.getNodeById.mockReturnValue({
      id: "parent",
      title: "Parent",
      completed: false,
      children: [{ id: "child", title: "Child", completed: false, children: [] }],
    });

    await expect(toggleItemAction(createFormData({ id: "parent", nextCompleted: "true" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?confirm=parent"
    );
  });

  test("toggleItemAction: ejecuta toggle + revalidate + redirect en happy path", async () => {
    servicesMock.getNodeById.mockReturnValue({
      id: "leaf",
      title: "Leaf",
      completed: false,
      children: [],
    });

    await expect(toggleItemAction(createFormData({ id: "leaf", nextCompleted: "true" }))).rejects.toThrow(
      "NEXT_REDIRECT:/"
    );

    expect(servicesMock.toggleItem).toHaveBeenCalledWith("leaf", true);
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  test("confirmParentAction: redirige error si no existe el nodo", async () => {
    servicesMock.getNodeById.mockReturnValue(undefined);

    await expect(confirmParentAction(createFormData({ id: "missing" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?error=action"
    );
  });

  test("confirmParentAction: completa y redirige en happy path", async () => {
    servicesMock.getNodeById.mockReturnValue({
      id: "parent",
      title: "Parent",
      completed: false,
      children: [{}],
    });

    await expect(confirmParentAction(createFormData({ id: "parent" }))).rejects.toThrow("NEXT_REDIRECT:/");
    expect(servicesMock.completeParent).toHaveBeenCalledWith("parent");
  });

  test("confirmUncheckParentAction: desmarca y redirige en happy path", async () => {
    servicesMock.getNodeById.mockReturnValue({
      id: "parent",
      title: "Parent",
      completed: true,
      children: [{}],
    });

    await expect(confirmUncheckParentAction(createFormData({ id: "parent" }))).rejects.toThrow(
      "NEXT_REDIRECT:/"
    );
    expect(servicesMock.uncheckParent).toHaveBeenCalledWith("parent");
  });

  test("resetCompletedAction: resetea y redirige", async () => {
    await expect(resetCompletedAction()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(servicesMock.resetCompletedItems).toHaveBeenCalledTimes(1);
  });

  test("createItemAction: valida parentId y redirige a add cuando no existe", async () => {
    servicesMock.getNodeById.mockReturnValue(undefined);

    await expect(createItemAction(createFormData({ title: "Nuevo", parentId: "missing" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?error=add"
    );
  });

  test("createItemAction: redirige a add cuando createItem falla", async () => {
    servicesMock.getNodeById.mockReturnValue({ id: "ok" });
    servicesMock.createItem.mockReturnValue(null);

    await expect(createItemAction(createFormData({ title: "Nuevo", parentId: "ok" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?error=add"
    );
  });

  test("createItemAction: create + revalidate + redirect en happy path", async () => {
    servicesMock.createItem.mockReturnValue([{ id: "n1" }]);

    await expect(createItemAction(createFormData({ title: "Nuevo" }))).rejects.toThrow("NEXT_REDIRECT:/");
    expect(servicesMock.createItem).toHaveBeenCalledWith("Nuevo", undefined);
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  test("deleteItemAction: redirige a error cuando no existe el nodo", async () => {
    servicesMock.getNodeById.mockReturnValue(undefined);

    await expect(deleteItemAction(createFormData({ id: "missing" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?error=delete"
    );
  });

  test("deleteItemAction: redirige a error cuando delete falla", async () => {
    servicesMock.getNodeById.mockReturnValue({ id: "ok", children: [] });
    servicesMock.deleteItem.mockReturnValue(null);

    await expect(deleteItemAction(createFormData({ id: "ok" }))).rejects.toThrow(
      "NEXT_REDIRECT:/?error=delete"
    );
  });

  test("deleteItemAction: elimina + revalida + redirige en happy path", async () => {
    servicesMock.getNodeById.mockReturnValue({ id: "ok", children: [] });
    servicesMock.deleteItem.mockReturnValue([{ id: "remaining" }]);

    await expect(deleteItemAction(createFormData({ id: "ok" }))).rejects.toThrow("NEXT_REDIRECT:/");
    expect(servicesMock.deleteItem).toHaveBeenCalledWith("ok");
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
