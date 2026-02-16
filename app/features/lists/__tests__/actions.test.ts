import {
  createListAction,
  deleteListAction,
  confirmParentAction,
  confirmUncheckParentAction,
  createItemAction,
  deleteItemAction,
  editListTitleAction,
  editItemTitleAction,
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
  createList: jest.fn(),
  createItem: jest.fn(),
  deleteList: jest.fn(),
  deleteItem: jest.fn(),
  getDefaultListId: jest.fn(),
  getListById: jest.fn(),
  getNodeById: jest.fn(),
  resetCompletedItems: jest.fn(),
  toggleItem: jest.fn(),
  uncheckParent: jest.fn(),
  updateListTitle: jest.fn(),
  updateItemTitle: jest.fn(),
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
    await expect(toggleItemAction(createFormData({ listId: "list-1", nextCompleted: "true" }))).rejects.toThrow(
      'Falta el campo requerido "id".'
    );
  });

  test("toggleItemAction: falta listId requerido", async () => {
    await expect(toggleItemAction(createFormData({ id: "abc", nextCompleted: "true" }))).rejects.toThrow(
      'Falta el campo requerido "listId".'
    );
  });

  test("toggleItemAction: valor boolean inválido", async () => {
    await expect(
      toggleItemAction(createFormData({ listId: "list-1", id: "abc", nextCompleted: "invalid" }))
    ).rejects.toThrow('Valor inválido para "nextCompleted".');
  });

  test("toggleItemAction: redirige a error cuando no existe el nodo", async () => {
    servicesMock.getNodeById.mockResolvedValue(undefined);

    await expect(
      toggleItemAction(createFormData({ listId: "list-1", id: "missing", nextCompleted: "true" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-1?error=action");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1?error=action");
  });

  test("toggleItemAction: redirige a confirm para padre no completado", async () => {
    servicesMock.getNodeById.mockResolvedValue({
      id: "parent",
      title: "Parent",
      completed: false,
      children: [{ id: "child", title: "Child", completed: false, children: [] }],
    });

    await expect(
      toggleItemAction(createFormData({ listId: "list-1", id: "parent", nextCompleted: "true" }))
    ).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?confirm=parent"
    );
  });

  test("toggleItemAction: ejecuta toggle + revalidate + redirect en happy path", async () => {
    servicesMock.getNodeById.mockResolvedValue({
      id: "leaf",
      title: "Leaf",
      completed: false,
      children: [],
    });

    servicesMock.toggleItem.mockResolvedValue([{ id: "leaf" }]);

    await expect(
      toggleItemAction(createFormData({ listId: "list-1", id: "leaf", nextCompleted: "true" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-1");

    expect(servicesMock.toggleItem).toHaveBeenCalledWith("list-1", "leaf", true);
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });

  test("confirmParentAction: redirige error si no existe el nodo", async () => {
    servicesMock.getNodeById.mockResolvedValue(undefined);

    await expect(confirmParentAction(createFormData({ listId: "list-1", id: "missing" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?error=action"
    );
  });

  test("confirmParentAction: completa y redirige en happy path", async () => {
    servicesMock.getNodeById.mockResolvedValue({
      id: "parent",
      title: "Parent",
      completed: false,
      children: [{}],
    });

    servicesMock.completeParent.mockResolvedValue([{ id: "parent" }]);

    await expect(confirmParentAction(createFormData({ listId: "list-1", id: "parent" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );
    expect(servicesMock.completeParent).toHaveBeenCalledWith("list-1", "parent");
  });

  test("confirmParentAction: no rompe si revalidateTag no tiene static generation store", async () => {
    servicesMock.getNodeById.mockResolvedValue({
      id: "parent",
      title: "Parent",
      completed: false,
      children: [{}],
    });
    servicesMock.completeParent.mockResolvedValue([{ id: "parent" }]);
    revalidateTagMock.mockImplementationOnce(() => {
      throw new Error("Invariant: static generation store missing in revalidateTag lists");
    });

    await expect(confirmParentAction(createFormData({ listId: "list-1", id: "parent" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });

  test("confirmUncheckParentAction: desmarca y redirige en happy path", async () => {
    servicesMock.getNodeById.mockResolvedValue({
      id: "parent",
      title: "Parent",
      completed: true,
      children: [{}],
    });

    servicesMock.uncheckParent.mockResolvedValue([{ id: "parent" }]);

    await expect(confirmUncheckParentAction(createFormData({ listId: "list-1", id: "parent" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );
    expect(servicesMock.uncheckParent).toHaveBeenCalledWith("list-1", "parent");
  });

  test("confirmUncheckParentAction: ignora reopenCompletedDialog y redirige a la lista", async () => {
    servicesMock.getNodeById.mockResolvedValue({
      id: "parent",
      title: "Parent",
      completed: true,
      children: [{}],
    });
    servicesMock.uncheckParent.mockResolvedValue([{ id: "parent" }]);

    await expect(
      confirmUncheckParentAction(
        createFormData({ listId: "list-1", id: "parent", reopenCompletedDialog: "true" })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-1");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });

  test("resetCompletedAction: resetea y redirige", async () => {
    servicesMock.resetCompletedItems.mockResolvedValue([{ id: "node-1" }]);

    await expect(resetCompletedAction(createFormData({ listId: "list-1" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );
    expect(servicesMock.resetCompletedItems).toHaveBeenCalledTimes(1);
  });

  test("createItemAction: valida parentId y redirige a add cuando no existe", async () => {
    servicesMock.getNodeById.mockResolvedValue(undefined);

    await expect(
      createItemAction(createFormData({ listId: "list-1", title: "Nuevo", parentId: "missing" }))
    ).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?error=add"
    );
  });

  test("createItemAction: redirige a add cuando createItem falla", async () => {
    servicesMock.getNodeById.mockResolvedValue({ id: "ok" });
    servicesMock.createItem.mockResolvedValue(null);

    await expect(
      createItemAction(createFormData({ listId: "list-1", title: "Nuevo", parentId: "ok" }))
    ).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?error=add"
    );
  });

  test("createItemAction: create + revalidate + redirect en happy path", async () => {
    servicesMock.createItem.mockResolvedValue([{ id: "n1" }]);

    await expect(createItemAction(createFormData({ listId: "list-1", title: "Nuevo" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );
    expect(servicesMock.createItem).toHaveBeenCalledWith("list-1", "Nuevo", undefined);
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });

  test("deleteItemAction: redirige a error cuando no existe el nodo", async () => {
    servicesMock.getNodeById.mockResolvedValue(undefined);

    await expect(deleteItemAction(createFormData({ listId: "list-1", id: "missing" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?error=delete"
    );
  });

  test("deleteItemAction: redirige a error cuando delete falla", async () => {
    servicesMock.getNodeById.mockResolvedValue({ id: "ok", children: [] });
    servicesMock.deleteItem.mockResolvedValue(null);

    await expect(deleteItemAction(createFormData({ listId: "list-1", id: "ok" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?error=delete"
    );
  });

  test("deleteItemAction: elimina + revalida + redirige en happy path", async () => {
    servicesMock.getNodeById.mockResolvedValue({ id: "ok", children: [] });
    servicesMock.deleteItem.mockResolvedValue([{ id: "remaining" }]);

    await expect(deleteItemAction(createFormData({ listId: "list-1", id: "ok" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );
    expect(servicesMock.deleteItem).toHaveBeenCalledWith("list-1", "ok");
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });

  test("editItemTitleAction: redirige a error cuando no existe el nodo", async () => {
    servicesMock.getNodeById.mockResolvedValue(undefined);

    await expect(
      editItemTitleAction(createFormData({ listId: "list-1", id: "missing", title: "Nuevo título" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-1?error=edit");
  });

  test("editItemTitleAction: redirige a error cuando update falla", async () => {
    servicesMock.getNodeById.mockResolvedValue({ id: "ok", title: "Old", children: [] });
    servicesMock.updateItemTitle.mockResolvedValue(null);

    await expect(
      editItemTitleAction(createFormData({ listId: "list-1", id: "ok", title: "Nuevo título" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-1?error=edit");
  });

  test("editItemTitleAction: actualiza + revalida + redirige en happy path", async () => {
    servicesMock.getNodeById.mockResolvedValue({ id: "ok", title: "Old", children: [] });
    servicesMock.updateItemTitle.mockResolvedValue([{ id: "ok", title: "Nuevo título" }]);

    await expect(
      editItemTitleAction(createFormData({ listId: "list-1", id: "ok", title: "Nuevo título" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-1");
    expect(servicesMock.updateItemTitle).toHaveBeenCalledWith("list-1", "ok", "Nuevo título");
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });

  test("createListAction: crea lista y redirige a la nueva ruta", async () => {
    servicesMock.createList.mockResolvedValue({ id: "list-new", title: "Sin nombre", items: [] });

    await expect(createListAction()).rejects.toThrow("NEXT_REDIRECT:/lists/list-new");

    expect(servicesMock.createList).toHaveBeenCalledWith("Sin nombre");
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-new");
  });

  test("deleteListAction: redirige a error cuando no se puede borrar la lista", async () => {
    servicesMock.deleteList.mockResolvedValue(false);

    await expect(
      deleteListAction(createFormData({ listId: "list-1", currentListId: "list-2" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-2?error=listDelete");

    expect(redirectMock).toHaveBeenCalledWith("/lists/list-2?error=listDelete");
  });

  test("deleteListAction: al borrar una lista no activa redirige a la actual", async () => {
    servicesMock.deleteList.mockResolvedValue(true);
    servicesMock.getListById.mockResolvedValue({ id: "list-2", title: "Lista 2", items: [] });

    await expect(
      deleteListAction(createFormData({ listId: "list-1", currentListId: "list-2" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-2");

    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-2");
  });

  test("deleteListAction: al borrar la lista activa redirige a otra existente", async () => {
    servicesMock.deleteList.mockResolvedValue(true);
    servicesMock.getDefaultListId.mockResolvedValue("list-2");

    await expect(
      deleteListAction(createFormData({ listId: "list-1", currentListId: "list-1" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-2");

    expect(servicesMock.getDefaultListId).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-2");
  });

  test("deleteListAction: crea una lista nueva cuando no quedan listas", async () => {
    servicesMock.deleteList.mockResolvedValue(true);
    servicesMock.getDefaultListId.mockResolvedValue(undefined);
    servicesMock.createList.mockResolvedValue({ id: "list-new", title: "Sin nombre", items: [] });

    await expect(
      deleteListAction(createFormData({ listId: "list-1", currentListId: "list-1" }))
    ).rejects.toThrow("NEXT_REDIRECT:/lists/list-new");

    expect(servicesMock.createList).toHaveBeenCalledWith("Sin nombre");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-new");
  });

  test("editListTitleAction: falta listId requerido", async () => {
    await expect(editListTitleAction(createFormData({ title: "Lista nueva" }))).rejects.toThrow(
      'Falta el campo requerido "listId".'
    );
  });

  test("editListTitleAction: permite title vacío", async () => {
    servicesMock.updateListTitle.mockResolvedValue({ id: "list-1", title: "", items: [] });

    await expect(editListTitleAction(createFormData({ listId: "list-1", title: "" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );

    expect(servicesMock.updateListTitle).toHaveBeenCalledWith("list-1", "");
  });

  test("editListTitleAction: redirige a error cuando update falla", async () => {
    servicesMock.updateListTitle.mockResolvedValue(null);

    await expect(editListTitleAction(createFormData({ listId: "list-1", title: "Lista nueva" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1?error=listEdit"
    );
  });

  test("editListTitleAction: actualiza + revalida + redirige en happy path", async () => {
    servicesMock.updateListTitle.mockResolvedValue({ id: "list-1", title: "Lista nueva", items: [] });

    await expect(editListTitleAction(createFormData({ listId: "list-1", title: "Lista nueva" }))).rejects.toThrow(
      "NEXT_REDIRECT:/lists/list-1"
    );

    expect(servicesMock.updateListTitle).toHaveBeenCalledWith("list-1", "Lista nueva");
    expect(revalidateTagMock).toHaveBeenCalledWith("lists", "max");
    expect(redirectMock).toHaveBeenCalledWith("/lists/list-1");
  });
});
