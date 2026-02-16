import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const listsStoreTable = sqliteTable("lists_store", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
});
