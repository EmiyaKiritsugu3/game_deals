import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Newsletter double-opt-in subscribers (Sprint 4, Task 1.3).
 *
 * status: 'pending' → 'active' → 'unsubscribed'.
 * confirmToken / unsubscribeToken are UUIDs embedded in email links.
 */
export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 20 }).notNull().default('pending'),
    confirmToken: uuid().notNull().defaultRandom(),
    unsubscribeToken: uuid().notNull().defaultRandom(),
    source: varchar({ length: 50 }).notNull().default('web'),
    createdAt: timestamp().defaultNow().notNull(),
    confirmedAt: timestamp(),
    unsubscribedAt: timestamp(),
  },
  (table) => [
    uniqueIndex('nls_email_unique').on(table.email),
    index('nls_status_idx').on(table.status),
    index('nls_confirm_token_idx').on(table.confirmToken),
    index('nls_unsub_token_idx').on(table.unsubscribeToken),
  ]
);
