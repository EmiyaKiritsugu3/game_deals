import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull(),
  kind: varchar({ length: 50 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  body: text(),
  payload: jsonb(),
  readAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});
