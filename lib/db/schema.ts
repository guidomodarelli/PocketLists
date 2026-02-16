import { integer, text, sqliteTable, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const listsTable = sqliteTable("lists", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const itemsTable = sqliteTable("items", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => listsTable.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnySQLiteColumn => itemsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
