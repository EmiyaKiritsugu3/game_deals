-- PHASE 20: ACTIVITY FEED INTEGRATION
-- Run this in the Supabase SQL Editor

-- Atividades (Reviews, Curtidas, etc.)
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'review', 'playlist_created', 'badge_earned', etc.
  target_id TEXT NOT NULL, -- ID do jogo no CheapShark, ID da playlist ou ID da badge
  target_name TEXT NOT NULL,
  target_thumb TEXT,
  content TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Atividades são públicas" ON activities FOR SELECT USING (true);
CREATE POLICY "Usuários criam suas próprias atividades" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
