export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  games_ids: string[];
  created_at: string;
}
