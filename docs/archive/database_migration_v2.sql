-- PHASE 19: GAMIFICATION & SOCIAL INFRASTRUCTURE

-- 1. Table for available badges
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_svg TEXT NOT NULL,
    rarity TEXT CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary')) DEFAULT 'Common',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User statistics (centralized counter for rewards)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    playlists_count INT DEFAULT 0,
    reviews_count INT DEFAULT 0,
    xp INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Relationship table for earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 4. Playlists table (social feature)
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    games_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Idempotent check)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for badges') THEN
        CREATE POLICY "Allow public read for badges" ON public.badges FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for user_stats') THEN
        CREATE POLICY "Allow public read for user_stats" ON public.user_stats FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update own stats') THEN
        CREATE POLICY "Allow users to update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for user_badges') THEN
        CREATE POLICY "Allow public read for user_badges" ON public.user_badges FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for public playlists') THEN
        CREATE POLICY "Allow public read for public playlists" ON public.playlists FOR SELECT USING (is_public = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage own playlists') THEN
        CREATE POLICY "Allow users to manage own playlists" ON public.playlists FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- SEED DATA: Initial Badges (Using ON CONFLICT to avoid errors)
INSERT INTO public.badges (name, description, rarity, icon_svg)
VALUES ('Playlist Master', 'Create 10 public game collections', 'Rare', '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>')
ON CONFLICT DO NOTHING;

-- AUTOMATION: Trigger to update user_stats on playlist creation
CREATE OR REPLACE FUNCTION public.handle_playlist_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_stats (user_id, playlists_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET playlists_count = user_stats.playlists_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_playlist_created') THEN
        CREATE TRIGGER on_playlist_created
        AFTER INSERT ON public.playlists
        FOR EACH ROW EXECUTE FUNCTION public.handle_playlist_count();
    END IF;
END $$;
