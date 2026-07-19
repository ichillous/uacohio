import { mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const systemMetadata = mysqlTable("system_metadata", {
  key: varchar("key", { length: 191 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().onUpdateNow().notNull(),
});
