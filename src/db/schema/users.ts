import { pgTable, uuid, varchar, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'mod', 'admin']);

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).unique(),
  username: varchar({ length: 100 }),
  avatarUrl: varchar({ length: 500 }),
  role: userRole().default('user'),
  xp: integer().default(0).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
