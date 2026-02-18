import { randomUUID } from "node:crypto";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { getTursoDb } from "@/lib/db/client";
import { INITIAL_LISTS } from "@/app/features/lists/data";
import { itemsTable, listsTable } from "@/lib/db/schema";
import type { ItemNode } from "../../domain/entities/ItemNode";
import type { List, ListSummary } from "../../domain/entities/List";
import type { ListsRepository } from "../../domain/repositories/ListsRepository";
import { normalizeTree } from "../../domain/services/tree";
import { buildTreeFromRecords, flattenTreeToRecords, type ItemRecord } from "../mappers/listTreeMapper";

function buildInitialLists(): List[] {
  return INITIAL_LISTS.map((list) => ({
    id: list.id,
    title: list.title,
    items: normalizeTree(list.items),
  }));
}

function normalizeTreeLists(lists: List[]): List[] {
  return lists.map((list) => ({
    id: list.id,
    title: list.title,
    items: normalizeTree(list.items ?? []),
  }));
}

export class TursoListsRepository implements ListsRepository {
  private initialized = false;
  private readonly initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initializeOnce();
  }

  private getDb() {
    const db = getTursoDb();
    if (!db) {
      throw new Error("Database no configurada. Definí TURSO_DATABASE_URL para operar con listas.");
    }
    return db;
  }

  private async ensureRelationalTables(): Promise<void> {
    const db = this.getDb();
    await db.run(sql`PRAGMA foreign_keys = ON`);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        list_id TEXT NOT NULL,
        parent_id TEXT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_id)`);
  }

  private async hasRelationalData(): Promise<boolean> {
    const db = this.getDb();
    const rows = await db.select({ count: sql<number>`count(*)` }).from(listsTable);
    const count = Number(rows[0]?.count ?? 0);
    return count > 0;
  }

  private async replaceAllLists(lists: List[]): Promise<void> {
    const db = this.getDb();
    const normalizedLists = normalizeTreeLists(lists);
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx.delete(itemsTable);
      await tx.delete(listsTable);

      if (normalizedLists.length > 0) {
        await tx.insert(listsTable).values(
          normalizedLists.map((list, position) => ({
            id: list.id,
            title: list.title,
            position,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      const itemRows = normalizedLists.flatMap((list) =>
        flattenTreeToRecords(list.id, list.items).map((item) => ({
          id: item.id,
          listId: item.listId,
          parentId: item.parentId,
          title: item.title,
          completed: item.completed,
          position: item.position,
          createdAt: now,
          updatedAt: now,
        }))
      );

      if (itemRows.length > 0) {
        await tx.insert(itemsTable).values(itemRows);
      }
    });
  }

  private async seedInitialListsIfEmpty(): Promise<void> {
    if (await this.hasRelationalData()) {
      return;
    }

    await this.replaceAllLists(buildInitialLists());
  }

  private async initializeOnce(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.ensureRelationalTables();
    await this.seedInitialListsIfEmpty();
    this.initialized = true;
  }

  async getLists(): Promise<List[]> {
    await this.initializationPromise;
    const db = this.getDb();
    const listRows = await db
      .select({
        id: listsTable.id,
        title: listsTable.title,
      })
      .from(listsTable)
      .orderBy(asc(listsTable.position));

    const itemRows = await db
      .select({
        id: itemsTable.id,
        listId: itemsTable.listId,
        parentId: itemsTable.parentId,
        title: itemsTable.title,
        completed: itemsTable.completed,
        position: itemsTable.position,
      })
      .from(itemsTable)
      .orderBy(asc(itemsTable.position));

    const rowsByList = new Map<string, ItemRecord[]>();
    for (const row of itemRows) {
      const current = rowsByList.get(row.listId) ?? [];
      current.push({
        id: row.id,
        listId: row.listId,
        parentId: row.parentId,
        title: row.title,
        completed: row.completed,
        position: row.position,
      });
      rowsByList.set(row.listId, current);
    }

    return listRows.map((list) => ({
      id: list.id,
      title: list.title,
      items: normalizeTree(buildTreeFromRecords(rowsByList.get(list.id) ?? [])),
    }));
  }

  async getListSummaries(): Promise<ListSummary[]> {
    await this.initializationPromise;
    const db = this.getDb();

    const listRows = await db
      .select({
        id: listsTable.id,
        title: listsTable.title,
      })
      .from(listsTable)
      .orderBy(asc(listsTable.position));

    return listRows.map((list) => ({
      id: list.id,
      title: list.title,
    }));
  }

  async getListById(listId: string): Promise<List | undefined> {
    await this.initializationPromise;
    const db = this.getDb();

    const listRows = await db
      .select({
        id: listsTable.id,
        title: listsTable.title,
      })
      .from(listsTable)
      .where(eq(listsTable.id, listId))
      .limit(1);

    const listRow = listRows[0];
    if (!listRow) {
      return undefined;
    }

    const itemRows = await db
      .select({
        id: itemsTable.id,
        listId: itemsTable.listId,
        parentId: itemsTable.parentId,
        title: itemsTable.title,
        completed: itemsTable.completed,
        position: itemsTable.position,
      })
      .from(itemsTable)
      .where(eq(itemsTable.listId, listId))
      .orderBy(asc(itemsTable.position));

    return {
      id: listRow.id,
      title: listRow.title,
      items: normalizeTree(
        buildTreeFromRecords(
          itemRows.map((row) => ({
            id: row.id,
            listId: row.listId,
            parentId: row.parentId,
            title: row.title,
            completed: row.completed,
            position: row.position,
          }))
        )
      ),
    };
  }

  async createList(title: string): Promise<List> {
    await this.initializationPromise;
    const db = this.getDb();
    const id = `list-${randomUUID()}`;
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx.run(sql`UPDATE lists SET position = position + 1`);
      await tx.insert(listsTable).values({
        id,
        title,
        position: 0,
        createdAt: now,
        updatedAt: now,
      });
    });

    return {
      id,
      title,
      items: [],
    };
  }

  async deleteList(listId: string): Promise<boolean> {
    await this.initializationPromise;
    const db = this.getDb();
    const existing = await db
      .select({ id: listsTable.id })
      .from(listsTable)
      .where(eq(listsTable.id, listId))
      .limit(1);

    if (!existing[0]) {
      return false;
    }

    await db.delete(listsTable).where(eq(listsTable.id, listId));
    return true;
  }

  async updateListTitle(listId: string, title: string): Promise<List | null> {
    await this.initializationPromise;
    const db = this.getDb();
    const existing = await db
      .select({ id: listsTable.id })
      .from(listsTable)
      .where(eq(listsTable.id, listId))
      .limit(1);

    if (!existing[0]) {
      return null;
    }

    await db
      .update(listsTable)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(eq(listsTable.id, listId));

    const list = await this.getListById(listId);
    return list ?? null;
  }

  async saveListItems(listId: string, items: ItemNode[]): Promise<ItemNode[] | null> {
    await this.initializationPromise;
    const db = this.getDb();

    const exists = await db
      .select({ id: listsTable.id })
      .from(listsTable)
      .where(eq(listsTable.id, listId))
      .limit(1);
    if (!exists[0]) {
      return null;
    }

    const normalizedItems = normalizeTree(items);
    const now = new Date().toISOString();
    const flatRows = flattenTreeToRecords(listId, normalizedItems);
    const incomingById = new Map(flatRows.map((item) => [item.id, item]));

    const existingRows = await db
      .select({
        id: itemsTable.id,
        listId: itemsTable.listId,
        parentId: itemsTable.parentId,
        title: itemsTable.title,
        completed: itemsTable.completed,
        position: itemsTable.position,
      })
      .from(itemsTable)
      .where(eq(itemsTable.listId, listId));

    const existingById = new Map(existingRows.map((row) => [row.id, row]));
    const itemIdsToDelete = existingRows
      .filter((existingRow) => !incomingById.has(existingRow.id))
      .map((existingRow) => existingRow.id);

    const itemsToInsert = flatRows.filter((incomingRow) => !existingById.has(incomingRow.id));
    const itemsToUpdate = flatRows.filter((incomingRow) => {
      const existingRow = existingById.get(incomingRow.id);
      if (!existingRow) {
        return false;
      }
      return (
        existingRow.parentId !== incomingRow.parentId ||
        existingRow.title !== incomingRow.title ||
        existingRow.completed !== incomingRow.completed ||
        existingRow.position !== incomingRow.position ||
        existingRow.listId !== incomingRow.listId
      );
    });

    await db.transaction(async (tx) => {
      if (itemIdsToDelete.length > 0) {
        await tx.delete(itemsTable).where(inArray(itemsTable.id, itemIdsToDelete));
      }

      if (itemsToInsert.length > 0) {
        await tx.insert(itemsTable).values(
          itemsToInsert.map((item) => ({
            id: item.id,
            listId: item.listId,
            parentId: item.parentId,
            title: item.title,
            completed: item.completed,
            position: item.position,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      for (const item of itemsToUpdate) {
        await tx
          .update(itemsTable)
          .set({
            listId: item.listId,
            parentId: item.parentId,
            title: item.title,
            completed: item.completed,
            position: item.position,
            updatedAt: now,
          })
          .where(eq(itemsTable.id, item.id));
      }

      await tx
        .update(listsTable)
        .set({ updatedAt: now })
        .where(eq(listsTable.id, listId));
    });

    return normalizedItems;
  }
}
