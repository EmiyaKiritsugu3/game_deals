-- PHASE 21: DRIZZLE ORM CACHE TABLES (OPTIONAL / FUTURE PROOFING)

-- 1. Games (Metadata Cache)
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    thumb TEXT,
    cheapest_price NUMERIC(10,2),
    cheapest_date TIMESTAMP,
    hltb_main INT,
    hltb_completionist INT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Stores (Cache)
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 3. Deals (Active Offers Cache)
CREATE TABLE IF NOT EXISTS public.deals (
    deal_id TEXT PRIMARY KEY,
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    retail_price NUMERIC(10,2) NOT NULL,
    savings NUMERIC(5,2) NOT NULL,
    deal_rating NUMERIC(3,1),
    steam_rating_percent INT,
    last_change TIMESTAMP,
    is_grey_market BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS para leituras públicas
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Permitir leitura publica stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Permitir leitura publica deals" ON public.deals FOR SELECT USING (true);
