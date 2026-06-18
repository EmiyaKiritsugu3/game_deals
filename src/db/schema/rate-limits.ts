import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const rateLimits = pgTable('rate_limits', {
  id: uuid().defaultRandom().primaryKey(),
  key: text().notNull().unique(),
  count: integer().notNull().default(0),
  resetAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
