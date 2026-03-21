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
