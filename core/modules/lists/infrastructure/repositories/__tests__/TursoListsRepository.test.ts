/** @jest-environment node */

import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getTursoDb, resetTursoClientForTests } from "@/lib/db/client";
import { itemsTable } from "@/lib/db/schema";
import { TursoListsRepository } from "../TursoListsRepository";

const TEST_DB_PATH = join(tmpdir(), `pocket-lists-core-${process.pid}.db`);
const TEST_DB_COMPANION_FILES = [`${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`];

function removeFileIfExists(path: string) {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

function resetDb() {
  resetTursoClientForTests();
  removeFileIfExists(TEST_DB_PATH);
  TEST_DB_COMPANION_FILES.forEach(removeFileIfExists);
}

describe("TursoListsRepository", () => {
  beforeEach(() => {
    process.env.TURSO_DATABASE_URL = `file:${TEST_DB_PATH}`;
    delete process.env.TURSO_AUTH_TOKEN;
    resetDb();
  });

  test("constructor bootstrap crea esquema relacional y seed inicial", async () => {
    const repository = new TursoListsRepository();

    const lists = await repository.getLists();
    expect(lists.length).toBeGreaterThan(0);
    expect(lists[0]?.id).toBe("list-travel");
  });

  test("preserva datos relacionales existentes y evita reseed inicial", async () => {
    const db = getTursoDb();
    if (!db) {
      throw new Error("Database should be available for migration test");
    }

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    const now = new Date().toISOString();
    await db.run(sql`
      INSERT INTO lists (id, title, position, created_at, updated_at)
      VALUES (
        'list-preloaded',
        'Preloaded list',
        0,
        ${now},
        ${now}
      )
    `);

    resetTursoClientForTests();
    const repository = new TursoListsRepository();

    const lists = await repository.getLists();
    expect(lists).toHaveLength(1);
    expect(lists[0]?.id).toBe("list-preloaded");
    expect(lists[0]?.title).toBe("Preloaded list");
  });

  test("getListSummaries consulta solo metadata de listas", async () => {
    const repository = new TursoListsRepository();

    const summaries = await repository.getListSummaries();

    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
      })
    );
  });

  test("saveListItems persiste cambios del árbol", async () => {
    const repository = new TursoListsRepository();

    const list = await repository.getListById("list-travel");
    expect(list).toBeDefined();

    const updatedItems = [
      {
        id: "item-custom",
        title: "Custom",
        completed: false,
        children: [],
      },
      ...(list?.items ?? []),
    ];

    await repository.saveListItems("list-travel", updatedItems);
    const reloaded = await repository.getListById("list-travel");

    expect(reloaded?.items[0]?.id).toBe("item-custom");
  });

  test("saveListItems no recrea filas existentes al agregar un ítem", async () => {
    const repository = new TursoListsRepository();
    const db = getTursoDb();
    if (!db) {
      throw new Error("Database should be available for persistence test");
    }

    const listId = "list-travel";
    const list = await repository.getListById(listId);
    const existingItemId = list?.items[0]?.id;
    expect(existingItemId).toBeDefined();

    const beforeInsert = await db
      .select({ createdAt: itemsTable.createdAt })
      .from(itemsTable)
      .where(eq(itemsTable.id, existingItemId!))
      .limit(1);
    const existingItemCreatedAt = beforeInsert[0]?.createdAt;
    expect(existingItemCreatedAt).toBeDefined();

    const updatedItems = [
      {
        id: "item-incremental-insert",
        title: "Incremental insert",
        completed: false,
        children: [],
      },
      ...(list?.items ?? []),
    ];

    await repository.saveListItems(listId, updatedItems);

    const afterInsert = await db
      .select({ createdAt: itemsTable.createdAt })
      .from(itemsTable)
      .where(eq(itemsTable.id, existingItemId!))
      .limit(1);
    expect(afterInsert[0]?.createdAt).toBe(existingItemCreatedAt);
  });

  test("saveListItems permite eliminar subárboles grandes sin exceder límites SQL", async () => {
    const repository = new TursoListsRepository();
    const listId = "list-travel";
    const bigTree = [
      {
        id: "item-parent-large",
        title: "Large parent",
        completed: false,
        children: Array.from({ length: 1100 }, (_, index) => ({
          id: `item-large-child-${index}`,
          title: `Large child ${index}`,
          completed: false,
          children: [],
        })),
      },
    ];

    await repository.saveListItems(listId, bigTree);
    await expect(repository.saveListItems(listId, [])).resolves.toEqual([]);
  });
});
