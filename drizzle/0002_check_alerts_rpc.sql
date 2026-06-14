-- Migration: 0002_check_alerts_rpc
-- Description: SECURITY DEFINER RPC for the check-alerts cron. Replaces
-- the route's anon-client UPDATE path (which referenced a non-existent
-- `currentPrice` column). Adds missing columns and a single
-- scoped SQL function.

--> statement-breakpoint

ALTER TABLE "price_alerts"
  ADD COLUMN IF NOT EXISTS "currentPrice" real,
  ADD COLUMN IF NOT EXISTS "lastCheckedAt" timestamp;--> statement-breakpoint

-- Drop old function in case it's lingering as a different definition.
DROP FUNCTION IF EXISTS public.check_alerts_for_all();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.check_alerts_for_all()
RETURNS TABLE (
  alert_id    uuid,
  user_id     uuid,
  game_id     uuid,
  store_id    varchar,
  target_price real,
  current_price real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alert   record;
  v_lowest  real;
BEGIN
  FOR v_alert IN
    SELECT pa.id, pa."userId", pa."gameId", pa."storeId", pa."targetPrice"
    FROM price_alerts pa
    WHERE pa."isActive" = 1
  LOOP
    SELECT MIN(d.price)::real INTO v_lowest
    FROM deals d
    WHERE d."gameId" = v_alert."gameId"
      AND (v_alert."storeId" IS NULL OR d."storeId"::text = v_alert."storeId");

    IF v_lowest IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE price_alerts pa
    SET "currentPrice" = v_lowest,
        "lastCheckedAt" = NOW()
    WHERE pa.id = v_alert.id;

    IF v_lowest <= v_alert."targetPrice" THEN
      alert_id      := v_alert.id;
      user_id       := v_alert."userId";
      game_id       := v_alert."gameId";
      store_id      := v_alert."storeId";
      target_price  := v_alert."targetPrice";
      current_price := v_lowest;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.check_alerts_for_all() FROM PUBLIC;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.check_alerts_for_all() TO service_role;--> statement-breakpoint
