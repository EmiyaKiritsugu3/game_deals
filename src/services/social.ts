import { supabase } from '@/lib/supabase';
import type { Playlist, UserBadge, UserStats } from '@/types/social';

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

// --- STATS & BADGES ---

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = Not found
  return data as UserStats;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data as UserBadge[];
}

/**
 * Logic to check and award badges based on stats.
 * Should be called after significant actions if not handled by DB triggers.
 */
export async function checkAchievements(userId: string) {
  const stats = await getUserStats(userId);
  if (!stats) return;

  // Badge: Playlist Master (10 lists)
  if (stats.playlists_count >= 10) {
    const { data: badges } = await supabase
      .from('badges')
      .select('id')
      .eq('name', 'Playlist Master')
      .single();
    if (badges) {
      await awardBadge(userId, badges.id);
    }
  }
}

async function awardBadge(userId: string, badgeId: string) {
  const { error } = await supabase
    .from('user_badges')
    .insert([{ user_id: userId, badge_id: badgeId }])
    .select();

  // If error is duplicate (23505), ignore it as user already has the badge.
  if (error && error.code !== '23505') throw error;
}
