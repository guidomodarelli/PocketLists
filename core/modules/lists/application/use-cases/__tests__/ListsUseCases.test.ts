import { createListsUseCases } from "../ListsUseCases";
import type { ItemNode } from "../../../domain/entities/ItemNode";
import type { List } from "../../../domain/entities/List";
import type { ListsRepository } from "../../../domain/repositories/ListsRepository";

class InMemoryListsRepository implements ListsRepository {
  constructor(private lists: List[]) {}

  async getLists(): Promise<List[]> {
    return this.lists;
  }

  async getListSummaries(): Promise<Array<{ id: string; title: string }>> {
    return this.lists.map((list) => ({ id: list.id, title: list.title }));
  }

  async getListById(listId: string): Promise<List | undefined> {
    return this.lists.find((list) => list.id === listId);
  }

  async createList(title: string): Promise<List> {
    const list: List = { id: `list-${this.lists.length + 1}`, title, items: [] };
    this.lists = [list, ...this.lists];
    return list;
  }

  async deleteList(listId: string): Promise<boolean> {
    const next = this.lists.filter((list) => list.id !== listId);
    const changed = next.length !== this.lists.length;
    this.lists = next;
    return changed;
  }

  async updateListTitle(listId: string, title: string): Promise<List | null> {
    const list = this.lists.find((candidate) => candidate.id === listId);
    if (!list) {
      return null;
    }

    list.title = title;
    return list;
  }

  async saveListItems(listId: string, items: ItemNode[]): Promise<ItemNode[] | null> {
    const list = this.lists.find((candidate) => candidate.id === listId);
    if (!list) {
      return null;
    }

    list.items = items;
    return items;
  }
}

function createRepository() {
  return new InMemoryListsRepository([
    {
      id: "list-1",
      title: "Lista 1",
      items: [
        {
          id: "root",
          title: "Root",
          completed: false,
          children: [{ id: "child", title: "Child", completed: false, children: [] }],
        },
      ],
    },
  ]);
}

describe("ListsUseCases", () => {
  test("getListSummaries devuelve id y title", async () => {
    const useCases = createListsUseCases(createRepository());
    await expect(useCases.getListSummaries()).resolves.toEqual([{ id: "list-1", title: "Lista 1" }]);
  });

  test("toggleItem en padre completa descendientes", async () => {
    const useCases = createListsUseCases(createRepository());
    const updated = await useCases.toggleItem("list-1", "root", true);
    expect(updated?.[0]?.completed).toBe(true);
    expect(updated?.[0]?.children.every((child) => child.completed)).toBe(true);
  });

  test("createItem retorna null cuando parent no existe", async () => {
    const useCases = createListsUseCases(createRepository());
    await expect(useCases.createItem("list-1", "Nuevo", "missing-parent")).resolves.toBeNull();
  });

  test("deleteList retorna false para lista inexistente", async () => {
    const useCases = createListsUseCases(createRepository());
    await expect(useCases.deleteList("missing-list")).resolves.toBe(false);
  });
});
