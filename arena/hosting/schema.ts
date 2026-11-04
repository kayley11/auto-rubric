import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// One connection record; no accounts, passwords, API keys or clinical data.
export const hostConnection = sqliteTable("host_connection", {
  id: integer("id").primaryKey(),
  origin: text("origin").notNull(),
  issuedAt: integer("issued_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  registrationId: text("registration_id").notNull(),
});
