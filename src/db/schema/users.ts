import { pgTable, uuid, varchar, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'mod', 'admin']);

// Profiles vinculados ao auth.users do Supabase (FK adicionada via SQL depois)
export const profiles = pgTable('profiles', {
  id: uuid().primaryKey(),
  username: varchar({ length: 100 }),
  avatarUrl: varchar({ length: 500 }),
  role: userRole().default('user'),
  xp: integer().default(0).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
