/** @jest-environment node */

import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { getTursoDb, resetTursoClientForTests } from "@/lib/db/client";
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
