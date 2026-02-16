import { randomUUID } from "node:crypto";
import type { ItemNode } from "../../domain/entities/ItemNode";
import type { List, ListSummary } from "../../domain/entities/List";
import type { ListsRepository } from "../../domain/repositories/ListsRepository";
import {
  findNode,
  normalizeTree,
  removeNodeFromTree,
  setSubtreeCompletion,
  updateNodeInTree,
} from "../../domain/services/tree";

export class ListsUseCases {
  constructor(private readonly repository: ListsRepository) {}

  private async ready(): Promise<void> {
    await this.repository.initialize();
  }

  async getLists(): Promise<List[]> {
    await this.ready();
    return this.repository.getLists();
  }

  async getListById(listId: string): Promise<List | undefined> {
    await this.ready();
    return this.repository.getListById(listId);
  }

  async getListSummaries(): Promise<ListSummary[]> {
    const lists = await this.getLists();
    return lists.map((list) => ({ id: list.id, title: list.title }));
  }

  async getDefaultListId(): Promise<string | undefined> {
    return (await this.getLists())[0]?.id;
  }

  async createList(title = "Sin nombre"): Promise<List> {
    await this.ready();
    return this.repository.createList(title);
  }

  async deleteList(listId: string): Promise<boolean> {
    await this.ready();
    return this.repository.deleteList(listId);
  }

  async updateListTitle(listId: string, title: string): Promise<List | null> {
    await this.ready();
    const normalizedTitle = title.trim();
    const list = await this.repository.getListById(listId);
    if (!list) {
      return null;
    }

    if (list.title === normalizedTitle) {
      return list;
    }

    return this.repository.updateListTitle(listId, normalizedTitle);
  }

  async getNodeById(listId: string, id: string): Promise<ItemNode | undefined> {
    const list = await this.getListById(listId);
    if (!list) {
      return undefined;
    }

    return findNode(list.items, id);
  }

  async toggleItem(listId: string, id: string, nextCompleted: boolean): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => {
      if (node.children.length > 0) {
        return setSubtreeCompletion(node, nextCompleted);
      }
      return { ...node, completed: nextCompleted };
    });

    return this.repository.saveListItems(listId, normalizeTree(updated));
  }

  async completeParent(listId: string, id: string): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, true));
    return this.repository.saveListItems(listId, normalizeTree(updated));
  }

  async uncheckParent(listId: string, id: string): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => setSubtreeCompletion(node, false));
    return this.repository.saveListItems(listId, normalizeTree(updated));
  }

  async resetCompletedItems(listId: string): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const updated = list.items.map((item) => setSubtreeCompletion(item, false));
    return this.repository.saveListItems(listId, normalizeTree(updated));
  }

  async createItem(listId: string, title: string, parentId?: string): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const newItem: ItemNode = {
      id: `item-${randomUUID()}`,
      title,
      completed: false,
      children: [],
    };

    if (!parentId) {
      return this.repository.saveListItems(listId, normalizeTree([newItem, ...list.items]));
    }

    const updated = updateNodeInTree(list.items, parentId, (node) => ({
      ...node,
      children: [newItem, ...node.children],
    }));

    if (updated === list.items) {
      return null;
    }

    return this.repository.saveListItems(listId, normalizeTree(updated));
  }

  async deleteItem(listId: string, id: string): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const [updated, changed] = removeNodeFromTree(list.items, id);
    if (!changed) {
      return null;
    }

    return this.repository.saveListItems(listId, normalizeTree(updated));
  }

  async updateItemTitle(listId: string, id: string, title: string): Promise<ItemNode[] | null> {
    const list = await this.getListById(listId);
    if (!list) {
      return null;
    }

    const updated = updateNodeInTree(list.items, id, (node) => ({
      ...node,
      title,
    }));

    if (updated === list.items) {
      return null;
    }

    return this.repository.saveListItems(listId, normalizeTree(updated));
  }
}
