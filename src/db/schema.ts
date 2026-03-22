import { pgTable, text, timestamp, integer, boolean, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. GAMES (Base Metadata)
export const games = pgTable('games', {
  id: text('id').primaryKey(), // CheapShark gameID
  title: text('title').notNull(),
  thumb: text('thumb'),
  cheapest_price: numeric('cheapest_price', { precision: 10, scale: 2 }),
  cheapest_date: timestamp('cheapest_date', { mode: 'date' }),

  // Extra Metadata not natively in CheapShark Deals
  hltb_main: integer('hltb_main'), // Hours to beat main story
  hltb_completionist: integer('hltb_completionist'), // Hours to 100%

  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow()
});

// 2. STORES (Cache)
export const stores = pgTable('stores', {
  id: text('id').primaryKey(), // CheapShark storeID
  name: text('name').notNull(),
  icon: text('icon'),
  is_active: boolean('is_active').default(true)
});

// 3. DEALS (Current Active Offers)
export const deals = pgTable('deals', {
  deal_id: text('deal_id').primaryKey(), // CheapShark dealID
  game_id: text('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  store_id: text('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),

  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  retail_price: numeric('retail_price', { precision: 10, scale: 2 }).notNull(),
  savings: numeric('savings', { precision: 5, scale: 2 }).notNull(),

  deal_rating: numeric('deal_rating', { precision: 3, scale: 1 }), // CheapShark 1-10 rating
  steam_rating_percent: integer('steam_rating_percent'), // Ex: 95
  last_change: timestamp('last_change', { mode: 'date' }),

  // Custom Gray Market flag mapped from store_id
  is_grey_market: boolean('is_grey_market').default(false),

  created_at: timestamp('created_at', { mode: 'date' }).defaultNow()
});

// Relations mapping for Drizzle queries (Joins)
export const gamesRelations = relations(games, ({ many }) => ({
  deals: many(deals)
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  game: one(games, {
    fields: [deals.game_id],
    references: [games.id]
  }),
  store: one(stores, {
    fields: [deals.store_id],
    references: [stores.id]
  })
}));
