'use server';

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL || '', { connect_timeout: 5 });

/**
 * Criar playlist
 */
export async function createPlaylistAction(
  userId: string,
  title: string,
  description: string,
  isPublic = false
) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const [playlist] = await sql`
    INSERT INTO playlists ("userId", title, slug, description, "isPublic", "createdAt", "updatedAt")
    VALUES (${userId}, ${title}, ${slug}, ${description}, ${isPublic}, NOW(), NOW())
    RETURNING *
  `;
  return playlist;
}

/**
 * Buscar playlists do usuário
 */
export async function getUserPlaylistsAction(userId: string) {
  return sql`
    SELECT p.*, COUNT(pg.id) AS "gameCount"
    FROM playlists p
    LEFT JOIN playlist_games pg ON pg."playlistId" = p.id
    WHERE p."userId" = ${userId}
    GROUP BY p.id
    ORDER BY p."createdAt" DESC
  `;
}

/**
 * Adicionar jogo na playlist
 */
export async function addGameToPlaylistAction(playlistId: string, gameId: string, notes?: string) {
  const [row] = await sql`
    INSERT INTO playlist_games ("playlistId", "gameId", notes, "addedAt")
    VALUES (${playlistId}, ${gameId}, ${notes || null}, NOW())
    ON CONFLICT ("playlistId", "gameId") DO NOTHING
    RETURNING *
  `;
  return row;
}

/**
 * Remover jogo da playlist
 */
export async function removeGameFromPlaylistAction(playlistId: string, gameId: string) {
  await sql`
    DELETE FROM playlist_games
    WHERE "playlistId" = ${playlistId} AND "gameId" = ${gameId}
  `;
  return true;
}

/**
 * Deletar playlist
 */
export async function deletePlaylistAction(playlistId: string) {
  await sql`DELETE FROM playlists WHERE id = ${playlistId}`;
  return true;
}

/**
 * Buscar playlist pública por slug
 */
export async function getPublicPlaylistAction(slug: string) {
  const [playlist] = await sql`
    SELECT p.* FROM playlists p
    WHERE p.slug = ${slug} AND p."isPublic" = true
  `;

  if (!playlist) return null;

  const games = await sql`
    SELECT pg.*, g.title, g."thumbUrl"
    FROM playlist_games pg
    JOIN games g ON g.id = pg."gameId"
    WHERE pg."playlistId" = ${playlist.id}
    ORDER BY pg."addedAt" DESC
  `;

  return { ...playlist, games };
}
