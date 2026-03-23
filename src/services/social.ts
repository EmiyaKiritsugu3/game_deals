import { supabase } from '@/lib/supabase';
import { Playlist, UserStats, UserBadge, Activity } from '@/types/social';

/**
 * SOCIAL & GAMIFICATION SERVICE
 * Handles playlists, stats, and achievements.
 */

// --- PLAYLISTS ---

export async function createPlaylist(userId: string, title: string, description?: string, isPublic: boolean = true) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase
    .from('playlists')
    .insert([{ user_id: userId, title, description, is_public: isPublic }])
    .select()
    .single();

  if (error) throw error;

  // Track activity
  await createActivity({
    user_id: userId,
    action_type: 'created_list',
    details: {
      targetId: data.id,
      targetName: title,
      targetThumb: '/images/default-playlist.png' // Default or dynamic image
    }
  });

  // Check achievements after creating a playlist to potentially award "Playlist Master"
  await checkAchievements(userId);

  return data as Playlist;
}

export async function getUserPlaylists(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Playlist[];
}

export async function addGameToPlaylist(playlistId: string, gameId: string) {
  if (!supabase) return;
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
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = Not found
  return data as UserStats;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  if (!supabase) return [];
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
  if (stats.playlists_count >= 10 && supabase) {
    const { data: badges } = await supabase.from('badges').select('id').eq('name', 'Playlist Master').single();
    if (badges) {
      await awardBadge(userId, badges.id);
    }
  }
}

async function awardBadge(userId: string, badgeId: string) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('user_badges')
    .insert([{ user_id: userId, badge_id: badgeId }])
    .select('*, badge:badges(*)');
    
  // If error is duplicate (23505), ignore it as user already has the badge.
  if (error && error.code !== '23505') throw error;

  if (data && data.length > 0 && data[0].badge) {
    const badge = data[0].badge;
    // Track activity
    await createActivity({
      user_id: userId,
      action_type: 'earned_badge',
      details: {
        targetId: badge.id,
        targetName: badge.name,
        badgeRarity: badge.rarity as 'Common' | 'Rare' | 'Epic' | 'Legendary',
        targetThumb: '' // Can use the svg icon later
      }
    });

    // TODO: Trigger Toast Notification locally here or via global state
    if (typeof window !== 'undefined') {
       // We can dispatch a custom event that the Toast component will listen to.
       const event = new CustomEvent('badgeAwarded', { detail: badge });
       window.dispatchEvent(event);
    }
  }
}

// --- ACTIVITIES ---

export async function createActivity(activity: { user_id: string; action_type: string; details: any }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('activities')
    .insert([activity])
    .select()
    .single();

  if (error) {
    console.error('Failed to create activity', error);
    return null;
  }
  return data;
}

export type ActivityType = 'earned_badge' | 'created_list' | 'reviewed_game' | 'upvoted_game';

export interface ActivityDetails {
  targetId?: string;
  targetName?: string;
  targetThumb?: string;
  rating?: number;
  badgeRarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  content?: string;
  [key: string]: unknown;
}

export interface UserStatsExpanded {
  user_id: string;
  username: string;
  playlists_count: number;
  reviews_count: number;
  xp: number;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  action_type: ActivityType;
  details: ActivityDetails;
  created_at: string;
  user_stats: UserStatsExpanded;
}

export async function getRecentActivities(limit: number = 20): Promise<ActivityFeedItem[]> {
  try {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        user_stats (
          user_id,
          username,
          playlists_count,
          reviews_count,
          xp
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase Error fetching activities:', error.message);
      return [];
    }

    return data as unknown as ActivityFeedItem[];

  } catch (err) {
    console.error('Unexpected error fetching activity feed:', err);
    return [];
  }
}

export async function getActivities(limit: number = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      user_stats (
        username
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch activities', error);
    return [];
  }

  // Map the join properly to simulate a generic feed
  return data.map((item: Activity & { user_stats?: { username: string } }) => ({
    ...item,
    user: {
      username: item.user_stats?.username || 'Unknown Gamer',
      avatar_url: '/images/default-avatar.png'
    }
  }));
}
