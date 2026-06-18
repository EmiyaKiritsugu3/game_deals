'use server';

import { type SQL, sql } from 'drizzle-orm';
import { resolveGameUuid } from '@/actions/deals';
import { db } from '@/db';
import { createClient } from '@/utils/supabase/server';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) throw new Error('Unauthorized');
  return data.user.id;
}

export interface PlaylistRow {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistGameRow {
  gameId: string;
  cheapsharkId: string | null;
  title: string | null;
  thumbUrl: string | null;
  addedAt: Date;
}

export interface PlaylistDetail extends PlaylistRow {
  games: PlaylistGameRow[];
}

export async function createPlaylistAction(
  userId: string,
  title: string,
  description?: string
): Promise<PlaylistRow> {
  const authedUserId = await getAuthenticatedUserId();
  if (authedUserId !== userId) throw new Error('Unauthorized');

  let slug = generateSlug(title);

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = (await db.execute(
      sql`INSERT INTO playlists ("userId", "title", "slug", "description")
          VALUES (${userId}, ${title}, ${slug}, ${description ?? null})
          ON CONFLICT ("userId", "slug") DO NOTHING
          RETURNING *`
    )) as unknown as PlaylistRow[];

    if (result.length > 0) return result[0];

    const suffix = Math.random().toString(36).substring(2, 8);
    slug = `${generateSlug(title)}-${suffix}`;
  }

  throw new Error('Failed to create playlist due to slug conflict');
}

export async function getUserPlaylistsAction(): Promise<PlaylistRow[]> {
  const userId = await getAuthenticatedUserId().catch(() => null);
  if (!userId) return [];

  const result = (await db.execute(
    sql`SELECT * FROM playlists WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`
  )) as unknown as PlaylistRow[];

  return result;
}

export async function getPlaylistByIdAction(id: string): Promise<PlaylistDetail | null> {
  const userId = await getAuthenticatedUserId().catch(() => null);
  if (!userId) return null;

  const playlists = (await db.execute(
    sql`SELECT * FROM playlists WHERE "id" = ${id}::uuid AND "userId" = ${userId}::uuid`
  )) as unknown as PlaylistRow[];

  if (playlists.length === 0) return null;

  const games = (await db.execute(
    sql`SELECT pg."gameId" AS "gameId", g."cheapsharkId" AS "cheapsharkId",
               g."title", g."thumbUrl" AS "thumbUrl", pg."addedAt" AS "addedAt"
        FROM playlist_games pg
        JOIN games g ON g."id" = pg."gameId"
        WHERE pg."playlistId" = ${id}
        ORDER BY pg."addedAt" DESC`
  )) as unknown as PlaylistGameRow[];

  return { ...playlists[0], games };
}

export async function addGameToPlaylistAction(
  playlistId: string,
  cheapsharkId: string
): Promise<boolean> {
  const userId = await getAuthenticatedUserId();

  const gameUuid = await resolveGameUuid(cheapsharkId);
  if (!gameUuid) throw new Error('Game not found or not yet ingested');

  const result = (await db.execute(
    sql`INSERT INTO playlist_games ("playlistId", "gameId")
        SELECT ${playlistId}::uuid, ${gameUuid}::uuid
        WHERE EXISTS (
          SELECT 1 FROM playlists
          WHERE "id" = ${playlistId}::uuid AND "userId" = ${userId}::uuid
        )
        AND NOT EXISTS (
          SELECT 1 FROM playlist_games
          WHERE "playlistId" = ${playlistId}::uuid AND "gameId" = ${gameUuid}::uuid
        )
        RETURNING id`
  )) as Array<{ id: string }>;

  return result.length > 0;
}

export async function removeGameFromPlaylistAction(
  playlistId: string,
  gameId: string
): Promise<boolean> {
  const userId = await getAuthenticatedUserId();

  const result = (await db.execute(
    sql`DELETE FROM playlist_games
        WHERE "playlistId" = ${playlistId}::uuid AND "gameId" = ${gameId}::uuid
        AND EXISTS (
          SELECT 1 FROM playlists
          WHERE "id" = ${playlistId}::uuid AND "userId" = ${userId}::uuid
        )
        RETURNING id`
  )) as Array<{ id: string }>;

  return result.length > 0;
}

export async function updatePlaylistAction(
  id: string,
  data: { title?: string; description?: string | null; isPublic?: boolean }
): Promise<PlaylistRow | null> {
  const userId = await getAuthenticatedUserId();

  const sets: SQL[] = [];
  if (data.title !== undefined) {
    sets.push(sql`"title" = ${data.title}`);
  }
  if (data.description !== undefined) {
    sets.push(sql`"description" = ${data.description}`);
  }
  if (data.isPublic !== undefined) {
    sets.push(sql`"isPublic" = ${data.isPublic}`);
  }

  if (sets.length === 0) return null;

  sets.push(sql`"updatedAt" = now()`);

  const result = (await db.execute(
    sql`UPDATE playlists SET ${sql.join(sets, sql`, `)}
        WHERE "id" = ${id}::uuid AND "userId" = ${userId}::uuid
        RETURNING *`
  )) as unknown as PlaylistRow[];

  return result[0] ?? null;
}

export async function deletePlaylistAction(id: string): Promise<boolean> {
  const userId = await getAuthenticatedUserId();

  await db.execute(sql`DELETE FROM playlist_games WHERE "playlistId" = ${id}::uuid`);

  const result = (await db.execute(
    sql`DELETE FROM playlists WHERE "id" = ${id}::uuid AND "userId" = ${userId}::uuid
        RETURNING id`
  )) as Array<{ id: string }>;

  return result.length > 0;
}
