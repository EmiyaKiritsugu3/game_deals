import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Affiliate network S2S conversion events (sales).
 *
 * Populated by /api/postback from networks (Impact, Awin, PartnerStack, CJ, etc.).
 * clickId correlates back to affiliate_clicks.id for funnel analytics.
 * orderId is the network-provided dedup key — networks retry on failure.
 *
 * ponytail: jsonb rawPayload kept for audit; no separate audit log table.
 */
export const affiliateConversions = pgTable(
  'affiliate_conversions',
  {
    id: uuid().defaultRandom().primaryKey(),
    storeId: varchar({ length: 50 }).notNull(),
    gameSlug: varchar({ length: 255 }),
    orderId: varchar({ length: 100 }).notNull(),
    clickId: uuid(),
    commissionCents: integer().notNull().default(0),
    currency: varchar({ length: 3 }).notNull().default('USD'),
    status: varchar({ length: 20 }).notNull().default('pending'),
    rawPayload: jsonb(),
    convertedAt: timestamp().defaultNow().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('acv_order_id_unique').on(table.orderId),
    index('acv_store_converted_idx').on(table.storeId, table.convertedAt),
    index('acv_click_id_idx').on(table.clickId),
  ]
);
