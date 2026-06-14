'use server';

import { sql } from 'drizzle-orm';
import { resolveGameUuid } from '@/actions/deals';
import { db } from '@/db';
import { createClient } from '@/utils/supabase/server';

/**
 * Criar playlist (com auth check)
 */
export async function createPlaylistAction(title: string, description: string, isPublic = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const inserted = await db.execute(sql`
    INSERT INTO playlists ("userId", title, slug, description, "isPublic", "createdAt", "updatedAt")
    VALUES (${user.id}::uuid, ${title}, ${slug}, ${description}, ${isPublic}, NOW(), NOW())
    RETURNING *
  `);
  return (inserted as unknown as Array<Record<string, unknown>>)[0];
}

/**
 * Buscar playlists do usuário logado
 */
export async function getUserPlaylistsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return db.execute(sql`
    SELECT p.*, COUNT(pg.id) AS "gameCount"
    FROM playlists p
    LEFT JOIN playlist_games pg ON pg."playlistId" = p.id
    WHERE p."userId" = ${user.id}::uuid
    GROUP BY p.id
    ORDER BY p."createdAt" DESC
  `);
}

/**
 * Adicionar jogo na playlist (com ownership check)
 */
// fallow-ignore-next-line complexity
export async function addGameToPlaylistAction(playlistId: string, gameId: string, notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const ownerRows = await db.execute(
    sql`SELECT "userId" FROM playlists WHERE id = ${playlistId}::uuid`
  );
  const playlist = (ownerRows as unknown as Array<{ userId: string }>)[0];
  if (!playlist || playlist.userId !== user.id) throw new Error('Forbidden');

  const uuid = await resolveGameUuid(gameId);
  if (!uuid) throw new Error('Game not found or not yet ingested');

  const inserted = await db.execute(sql`
    INSERT INTO playlist_games ("playlistId", "gameId", notes, "addedAt")
    VALUES (${playlistId}::uuid, ${uuid}::uuid, ${notes ?? null}, NOW())
    ON CONFLICT ("playlistId", "gameId") DO NOTHING
    RETURNING *
  `);
  return (inserted as unknown as Array<Record<string, unknown>>)[0];
}

/**
 * Remover jogo da playlist (com ownership check)
 */
// fallow-ignore-next-line complexity
export async function removeGameFromPlaylistAction(playlistId: string, gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const ownerRows = await db.execute(
    sql`SELECT "userId" FROM playlists WHERE id = ${playlistId}::uuid`
  );
  const playlist = (ownerRows as unknown as Array<{ userId: string }>)[0];
  if (!playlist || playlist.userId !== user.id) throw new Error('Forbidden');

  const uuid = await resolveGameUuid(gameId);
  if (!uuid) throw new Error('Game not found or not yet ingested');

  await db.execute(sql`
    DELETE FROM playlist_games
    WHERE "playlistId" = ${playlistId}::uuid AND "gameId" = ${uuid}::uuid
  `);
  return true;
}

/**
 * Deletar playlist (com ownership check)
 */
export async function deletePlaylistAction(playlistId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const ownerRows = await db.execute(
    sql`SELECT "userId" FROM playlists WHERE id = ${playlistId}::uuid`
  );
  const playlist = (ownerRows as unknown as Array<{ userId: string }>)[0];
  if (!playlist || playlist.userId !== user.id) throw new Error('Forbidden');

  await db.execute(sql`DELETE FROM playlists WHERE id = ${playlistId}::uuid`);
  return true;
}

/**
 * Buscar playlist pública por slug
 */
export async function getPublicPlaylistAction(slug: string) {
  const playlistRows = await db.execute(sql`
    SELECT p.* FROM playlists p
    WHERE p.slug = ${slug} AND p."isPublic" = true
  `);
  const playlist = (playlistRows as unknown as Array<Record<string, unknown>>)[0];
  if (!playlist) return null;

  const games = await db.execute(sql`
    SELECT pg.*, g.title, g."thumbUrl"
    FROM playlist_games pg
    JOIN games g ON g.id = pg."gameId"
    WHERE pg."playlistId" = ${playlist.id}::uuid
    ORDER BY pg."addedAt" DESC
  `);

  return { ...playlist, games };
}
