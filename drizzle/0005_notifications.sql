-- Migration: 0005_notifications
-- Description: notifications table for in-app price-alert delivery.
-- Extends check_alerts_for_all() to insert a notification per triggered alert.

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "kind" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text,
  "payload" jsonb,
  "readAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_auth_users_fk"
  FOREIGN KEY ("userId") REFERENCES "auth"."users"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx"
  ON "notifications" ("userId", "createdAt" DESC)
  WHERE "readAt" IS NULL;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_user_recent_idx"
  ON "notifications" ("userId", "createdAt" DESC);--> statement-breakpoint

DROP FUNCTION IF EXISTS public.check_alerts_for_all();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.check_alerts_for_all()
RETURNS TABLE (
  notification_id uuid,
  user_id        uuid,
  game_id        uuid,
  store_id       varchar,
  target_price   real,
  current_price  real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_alert   record;
  v_lowest  real;
  v_game_title text;
  v_existing_id uuid;
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
      SELECT COALESCE(g.title, 'Your game') INTO v_game_title
      FROM games g WHERE g.id = v_alert."gameId";

      SELECT id INTO v_existing_id
      FROM notifications n
      WHERE n."userId" = v_alert."userId"
        AND n.kind = 'price_alert'
        AND (n.payload->>'gameId')::uuid = v_alert."gameId"
        AND n."createdAt" > NOW() - INTERVAL '1 hour'
      LIMIT 1;

      IF v_existing_id IS NULL THEN
        INSERT INTO notifications ("userId", kind, title, body, payload)
        VALUES (
          v_alert."userId",
          'price_alert',
          format('Price drop: %s', v_game_title),
          format('Now $%s (target $%s)', v_lowest::text, v_alert."targetPrice"::text),
          jsonb_build_object(
            'gameId', v_alert."gameId",
            'alertId', v_alert.id,
            'currentPrice', v_lowest,
            'targetPrice', v_alert."targetPrice"
          )
        )
        RETURNING id INTO notification_id;
      ELSE
        notification_id := v_existing_id;
      END IF;

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

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own ON public.notifications
      FOR SELECT TO authenticated
      USING ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_update_own'
  ) THEN
    CREATE POLICY notifications_update_own ON public.notifications
      FOR UPDATE TO authenticated
      USING ("userId" = auth.uid())
      WITH CHECK ("userId" = auth.uid());
  END IF;
END $$;--> statement-breakpoint
