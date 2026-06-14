-- Migration: 0004_storeid_varchar
-- Description: Replace public.store enum on deals.storeId with varchar(50)
-- to match price_history/price_alerts/affiliate_clicks and accept CheapShark
-- store identifiers (numeric strings + grey-market names).

--> statement-breakpoint

DO $$
DECLARE
  v_has_data boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM deals LIMIT 1) INTO v_has_data;
  IF v_has_data THEN
    ALTER TABLE deals
      ALTER COLUMN "storeId" TYPE varchar(50) USING "storeId"::text;
  ELSE
    ALTER TABLE deals
      ALTER COLUMN "storeId" TYPE varchar(50);
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deals_storeId_check'
  ) THEN
    ALTER TABLE deals
      ADD CONSTRAINT deals_storeId_check
      CHECK (length("storeId") BETWEEN 1 AND 50);
  END IF;
END $$;--> statement-breakpoint

DROP TYPE IF EXISTS public.store;--> statement-breakpoint
