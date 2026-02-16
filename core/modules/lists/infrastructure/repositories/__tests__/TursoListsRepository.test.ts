/** @jest-environment node */

import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { getTursoDb, resetTursoClientForTests } from "@/lib/db/client";
import { listsStoreTable } from "@/lib/db/schema";
import { TursoListsRepository } from "../TursoListsRepository";

type GlobalStore = typeof globalThis & {
  __pocketListsStore?: unknown;
};

const TEST_DB_PATH = join(tmpdir(), `pocket-lists-core-${process.pid}.db`);
const TEST_DB_COMPANION_FILES = [`${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`];

function removeFileIfExists(path: string) {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

function resetDb() {
  delete (globalThis as GlobalStore).__pocketListsStore;
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

  test("migrates lists_store JSON cuando no hay tablas relacionales pobladas", async () => {
    const db = getTursoDb();
    if (!db) {
      throw new Error("Database should be available for migration test");
    }

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS lists_store (
        id TEXT PRIMARY KEY NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await db
      .insert(listsStoreTable)
      .values({
        id: "lists-store",
        data: JSON.stringify({
          lists: [
            {
              id: "legacy-list",
              title: "Legacy list",
              items: [{ id: "legacy-item", title: "Legacy item", completed: false, children: [] }],
            },
          ],
        }),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: listsStoreTable.id,
        set: {
          data: JSON.stringify({
            lists: [
              {
                id: "legacy-list",
                title: "Legacy list",
                items: [{ id: "legacy-item", title: "Legacy item", completed: false, children: [] }],
              },
            ],
          }),
          updatedAt: new Date().toISOString(),
        },
      });

    resetTursoClientForTests();
    const repository = new TursoListsRepository();

    const lists = await repository.getLists();
    expect(lists).toHaveLength(1);
    expect(lists[0]?.id).toBe("legacy-list");
    expect(lists[0]?.items[0]?.id).toBe("legacy-item");
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
});
