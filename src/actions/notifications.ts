'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { createClient } from '@/utils/supabase/server';

export async function getNotificationsAction(limit = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], unread: 0 };

  const [{ rows, unread }] = (await db.execute(sql`
    WITH recent AS (
      SELECT * FROM notifications
      WHERE "userId" = ${user.id}::uuid
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    ),
    cnt AS (
      SELECT COUNT(*)::int AS unread FROM notifications
      WHERE "userId" = ${user.id}::uuid AND "readAt" IS NULL
    )
    SELECT
      (SELECT json_agg(recent.*) FROM recent) AS rows,
      (SELECT unread FROM cnt) AS unread
  `)) as unknown as Array<{
    rows: Array<typeof notifications.$inferSelect>;
    unread: number;
  }>;

  return {
    items: Array.isArray(rows) ? rows : [],
    unread: Number(unread ?? 0),
  };
}

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await db
    .update(notifications)
    .set({ readAt: sql`NOW()` })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  revalidatePath('/');
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await db
    .update(notifications)
    .set({ readAt: sql`NOW()` })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  revalidatePath('/');
}
