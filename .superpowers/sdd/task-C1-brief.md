# Task C1: Gamification DB Migration

## Context
Spec: docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md §4

## Requirements

### 1. Generate migration skeleton
```bash
pnpm db:generate --custom --name=user_stats
```
This creates an empty SQL migration file in `drizzle/`.

### 2. Write migration SQL in that file

```sql
-- New table: user_stats
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INT NOT NULL DEFAULT 0,
  opt_in_leaderboard BOOLEAN NOT NULL DEFAULT false
);

-- RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "system upserts user stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "system updates user stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Idempotent badge awarding function
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_name TEXT)
RETURNS UUID AS $$
DECLARE
  v_badge_id UUID;
  v_result UUID;
BEGIN
  SELECT id INTO v_badge_id FROM badges WHERE name = p_badge_name;
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge not found: %', p_badge_name;
  END IF;

  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, v_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING id INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 3. Verify via `pnpm db:migrate` (if local DB running) OR just lint

### 4. Read existing gamification schema for reference
File: `src/db/schema/gamification.ts`

### 5. Add `userStats` export to schema

In `src/db/schema/gamification.ts`, add:

```ts
export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').primaryKey().notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  xp: integer().notNull().default(0),
  optInLeaderboard: boolean('opt_in_leaderboard').notNull().default(false),
});
```

This allows Drizzle to type-check queries against the table.

## Constraints
- `profiles.userId` is the FK target pattern used in existing schema (check `src/db/schema/users.ts`)
- Verify column casing: Drizzle PG uses snake_case column names, camelCase JS names
- FK references `profiles.id` (the UUID PK in profiles table, NOT `userId`)
- RLS policies use `auth.uid()` which is Supabase-specific (not Drizzle) — safe in raw SQL

## Deliverables
- Migration file in `drizzle/` directory
- Updated `src/db/schema/gamification.ts` with `userStats` export
- Both committed
