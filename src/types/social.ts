export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_svg: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface UserStats {
  user_id: string;
  username: string;
  playlists_count: number;
  reviews_count: number;
  xp: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge; // Optional join
}

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  games_ids: string[];
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: 'review' | 'playlist_created' | 'badge_earned' | string;
  target_id: string;
  target_name: string;
  target_thumb?: string;
  content?: string;
  rating?: number;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string; // If avatar URL is in auth.users or user_stats
  };
}
