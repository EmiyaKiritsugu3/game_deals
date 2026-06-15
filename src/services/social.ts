import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

import type { Playlist } from '@/types/social';

/**
 * SOCIAL & GAMIFICATION SERVICE
 * Handles playlists, stats, and achievements.
 */

// --- PLAYLISTS ---

export async function createPlaylist(
  userId: string,
  title: string,
  description?: string,
  isPublic: boolean = true
) {
  const { data, error } = await supabase
    .from('playlists')
    .insert([{ user_id: userId, title, description, is_public: isPublic }])
    .select()
    .single();

  if (error) throw error;
  return data as Playlist;
}

export async function getUserPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Playlist[];
}

export async function addGameToPlaylist(playlistId: string, gameId: string) {
  // First get current games
  const { data: playlist } = await supabase
    .from('playlists')
    .select('games_ids')
    .eq('id', playlistId)
    .single();

  if (!playlist) return;

  const games = Array.isArray(playlist.games_ids) ? [...playlist.games_ids] : [];
  if (games.includes(gameId)) return; // Already in list

  const { error } = await supabase
    .from('playlists')
    .update({ games_ids: [...games, gameId] })
    .eq('id', playlistId);

  if (error) throw error;
}
