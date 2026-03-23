-- PHASE 20: ACTIVITY FEED INTEGRATION
-- Run this in the Supabase SQL Editor

-- Atividades (Reviews, Curtidas, etc.)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_activities_user_stats FOREIGN KEY (user_id) REFERENCES public.user_stats(user_id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Atividades são públicas" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Usuários criam suas próprias atividades" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
