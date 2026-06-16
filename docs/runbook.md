# Runbook — GameDeals Operations

> **Last updated:** 2026-06-13
> **Stack:** Next.js 16 (Turbopack) + Supabase SSR + Drizzle ORM + CheapShark API + Typesense
> **Deployment:** Vercel (production) + Local dev
> **Monitoring:** None (manual runbook — no Datadog/PagerDuty)

---

## Table of Contents

| # | Playbook | Severity |
|---|----------|----------|
| 1 | [Price Ingestion Cron Failure](#playbook-price-ingestion-cron-failure) | CRITICAL |
| 2 | [Typesense Reindex Failure](#playbook-typesense-reindex-failure) | HIGH |
| 3 | [Alert Check Cron Failure](#playbook-alert-check-cron-failure) | MEDIUM |
| 4 | [DB Connection Pool Exhaustion](#playbook-db-connection-pool-exhaustion) | CRITICAL |
| 5 | [Supabase Auth Outage](#playbook-supabase-auth-outage) | CRITICAL |
| 6 | [CheapShark API Down](#playbook-cheapshark-api-down) | HIGH |
| 7 | [Typesense Search Down](#playbook-typesense-search-down) | HIGH |
| 8 | [Vercel Deployment Failure](#playbook-vercel-deployment-failure) | HIGH |
| 9 | [Env Key Rotation (Security)](#playbook-env-key-rotation-security) | CRITICAL |
| 10 | [OOM Prevention (Dev)](#playbook-oom-prevention-dev) | LOW |
| 11 | [Middleware Auth Loop](#playbook-middleware-auth-loop) | HIGH |
| 12 | [Affiliate Redirect Breakage](#playbook-affiliate-redirect-breakage) | LOW |

---

## Playbook: Price Ingestion Cron Failure

**Severity:** CRITICAL
**Service:** Price updates & deal freshness
**Description:** The cron job that fetches CheapShark deals and upserts into `deals` + `price_history` tables fails. Users see stale deals.

### Symptoms
- Deal prices haven't changed in hours (check homepage)
- `Vercel Cron Job` logs show error or 500 response
- `ingestPricesAction` returns `success: false`
- No recent rows in `price_history` table

### Debugging

**1. Check last successful run timestamp**

Query the DB for most recent price recording:

```bash
pnpm db:studio
# In Drizzle Studio, sort price_history by recorded_at DESC
```

Or direct SQL via `psql`:

```bash
psql "$DATABASE_URL" -c "SELECT MAX(recorded_at) FROM price_history;"
```

**2. Trigger cron endpoint manually (localhost)**

```bash
curl -v http://localhost:3000/api/cron/ingest-prices \
  -H "authorization: Bearer $CRON_SECRET"
```

Expected response: `{"success":true,"dealsIngested":100,"gamesUpserted":80,"pricesRecorded":100}`

If 401: check `CRON_SECRET` env var matches the header value.

**3. Check CheapShark API health**

```bash
curl -v https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=5
```

Expected: 200 with JSON array. If not 200 or empty, CheapShark is down.

**4. Check server logs (Vercel)**

```bash
# Vercel dashboard > Deployments > latest > Runtime Logs
# Search for "[Cron] Starting price ingestion..."
```

Or via Vercel CLI:

```bash
vercel logs game-deals --since=1h
```

**5. Verify DB connection**

```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Mitigation

1. **If CheapShark API is down:** No action needed — the cron returns fallback data. Wait for CheapShark recovery. Check [CheapShark status](#playbook-cheapshark-api-down).

2. **If DB is unreachable:**
   - Verify `DATABASE_URL` is correct in Vercel env vars
   - Check Supabase dashboard for connection limits
   - See [DB Connection Pool Exhaustion](#playbook-db-connection-pool-exhaustion)

3. **If CRON_SECRET mismatch:**
   ```bash
   # Re-deploy with correct env var
   vercel env rm CRON_SECRET production
   vercel env add CRON_SECRET production
   vercel --prod
   ```

4. **Manual trigger after fix:**
   ```bash
   curl -X GET "https://game-deals.vercel.app/api/cron/ingest-prices" \
     -H "authorization: Bearer $CRON_SECRET"
   ```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Supabase support if DB pool exhausted
- **If stale > 6 hours:** Email users about delayed price updates

---

## Playbook: Typesense Reindex Failure

**Severity:** HIGH
**Service:** Search functionality
**Description:** Daily Typesense reindex cron fails. Search results become stale or empty.

### Symptoms
- Search returns no results or outdated results
- `syncGamesToTypesenseAction` returns `success: false`
- Vercel cron log shows `Typesense not configured` or `CheapShark error`
- Typesense dashboard shows 0 documents in `games` collection

### Debugging

**1. Check Typesense health**

```bash
curl -v http://localhost:8108/health
```

Expected: `{"ok":true}`

If Typesense is cloud-hosted:

```bash
curl -v https://$TYPESENSE_HOST/health \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY"
```

**2. Check collection exists**

```bash
curl -v https://$TYPESENSE_HOST/collections \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY"
```

Expected: array containing `games` collection with document count.

**3. Trigger reindex manually (localhost)**

```bash
curl -v http://localhost:3000/api/cron/reindex-typesense \
  -H "authorization: Bearer $CRON_SECRET"
```

Expected: `{"success":true,"indexed":100}`

**4. Verify env vars**

```bash
echo $TYPESENSE_ADMIN_KEY      # Must be non-empty
echo $NEXT_PUBLIC_TYPESENSE_SEARCH_KEY  # Must be non-empty
echo $NEXT_PUBLIC_TYPESENSE_URL         # Must be valid
```

**5. Check CheapShark API for reindex data source**

```bash
curl -s "https://www.cheapshark.com/api/1.0/deals?sortBy=Deal%20Rating&onSale=1&pageSize=3" | head -c 500
```

### Mitigation

1. **If Typesense not configured:**
   - Set `TYPESENSE_ADMIN_KEY` and `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` in Vercel env
   - Create collection manually:
     ```bash
     curl -X POST https://$TYPESENSE_HOST/collections \
       -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY" \
       -H "Content-Type: application/json" \
       -d '{
         "name": "games",
         "fields": [
           {"name": "gameID", "type": "string"},
           {"name": "title", "type": "string"},
           {"name": "thumb", "type": "string"},
           {"name": "cheapest", "type": "string"},
           {"name": "cheapestPrice", "type": "float"},
           {"name": "metacriticScore", "type": "int32", "optional": true},
           {"name": "steamRating", "type": "int32", "optional": true}
         ],
         "default_sorting_field": "cheapestPrice"
       }'
     ```

2. **If CheapShark error:** See [CheapShark API Down](#playbook-cheapshark-api-down).

3. **Manual reindex after fix:**
   ```bash
   curl -X GET "https://game-deals.vercel.app/api/cron/reindex-typesense" \
     -H "authorization: Bearer $CRON_SECRET"
   ```

4. **Verify search works:**
   ```bash
   curl "https://$TYPESENSE_HOST/collections/games/documents/search?q=zelda&query_by=title" \
     -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY"
   ```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Typesense cloud support (if using Typesense Cloud)
- **Fallback:** Search falls back to CheapShark API automatically — users can still find games, but slower

---

## Playbook: Alert Check Cron Failure

**Severity:** MEDIUM
**Service:** Price alert notifications
**Description:** Cron job that checks `price_alerts` against current CheapShark prices fails. Users don't get notified of price drops.

### Symptoms
- Users report not receiving price alerts
- Vercel cron log shows errors
- `check-alerts` endpoint returns 500

### Debugging

**1. Trigger alert check manually (localhost)**

```bash
curl -v http://localhost:3000/api/cron/check-alerts \
  -H "authorization: Bearer $CRON_SECRET"
```

Expected 200 response with:
```json
{"processed":5,"triggered":2,"details":[...]}
```

**2. Check price_alerts table**

```sql
-- Via psql or Drizzle Studio
SELECT COUNT(*) FROM price_alerts WHERE "isActive" = 1;
```

If count is 0: no active alerts exist (no user has created any).

**3. Verify Supabase access**

```bash
# Check that the Supabase service role key works
curl -s -o /dev/null -w "%{http_code}" "https://$NEXT_PUBLIC_SUPABASE_URL/rest/v1/price_alerts?limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: 200. If 401/403: service role key is invalid or rotated.

**4. Check CheapShark pricing for a specific alert game**

```bash
curl -s "https://www.cheapshark.com/api/1.0/games?id=<gameId>" | jq '.deals[0].price'
```

Compare with target price in `price_alerts` table.

### Mitigation

1. **If CRON_SECRET mismatch:** See [Price Ingestion Cron Failure](#playbook-price-ingestion-cron-failure).

2. **If Supabase service role key is invalid:**
   - Rotate the key in Supabase dashboard
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars
   - See [Env Key Rotation](#playbook-env-key-rotation-security)

3. **If CheapShark API is down:** Alerts cannot be checked. Users will miss notifications until CheapShark recovers.

4. **If price_alerts table schema mismatch** (past issue — snake_case vs camelCase):
   ```bash
   psql "$DATABASE_URL" -c "\d price_alerts"
   ```
   Verify columns use snake_case. If mismatch, run latest migration:
   ```bash
   pnpm db:migrate
   ```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Supabase support (schema/latency issues)

---

## Playbook: DB Connection Pool Exhaustion

**Severity:** CRITICAL
**Service:** All database-dependent functionality
**Description:** The PostgreSQL connection pool (via pgBouncer-compatible `postgres` client) is exhausted. All DB queries fail.

### Symptoms
- Homepage loads but deal data is empty
- Server errors in all pages/queries that hit the DB
- `psql` connection attempts time out
- Error: `remaining connection slots are reserved for non-replication superuser connections`

### Debugging

**1. Check active connections**

```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

**2. List all connections (with usename and application_name)**

```bash
psql "$DATABASE_URL" -c "SELECT pid, usename, application_name, state, query_start, query FROM pg_stat_activity ORDER BY query_start DESC;"
```

**3. Check pool settings**

```bash
# Supabase project > Database > Connection pooler
# Verify pool size (default: 15 for Supabase free tier, 60+ for Pro)
```

**4. Check for stuck/long-running queries**

```bash
psql "$DATABASE_URL" -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;"
```

**5. Check Supabase dashboard metrics**

```
Supabase Dashboard > Database > Pooling
Look for: connections chart, idle-in-transaction count
```

### Mitigation

**1. Kill idle connections**

```bash
# Kill idle connections older than 30 minutes
psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '30 minutes';"
```

**2. Kill stuck queries**

```bash
# Find the pid of the stuck query, then:
psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(<pid>);"
```

**3. Increase pool size (Supabase)**

```
Supabase Dashboard > Database > Connection pooler
Increase pool size (max: 60 for Pro plan)
```

**4. Reduce `postgres` client connections**

Edit `src/db/index.ts` to limit pool size:

```typescript
const queryClient = postgres(dbUrl, { max: 10 });  // Add max connections limit
```

Currently the pool is unbounded — each concurrent request gets a new connection.

**5. Restart the application**

```bash
# Vercel: re-deploy to clear serverless connection buildup
vercel --prod
```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Supabase support (pool size limits, connection leak investigation)
- **If recurring:** Implement proper connection pooling with `max` parameter in `postgres` client

---

## Playbook: Supabase Auth Outage

**Severity:** CRITICAL
**Service:** User authentication (login, wishlist, alerts, protected routes)
**Description:** Supabase Auth is unavailable. Users cannot log in. Protected routes may break.

### Symptoms
- Login/signup forms return errors
- Wishlist page shows login prompt even when authenticated
- `auth.getUser()` returns null for all users
- Auth callback redirects fail
- Supabase status page indicates incident

### Debugging

**1. Check Supabase status**

```bash
curl -s https://status.supabase.com | grep -i "auth\|incident\|degraded"
```

Or visit: https://status.supabase.com

**2. Verify Supabase project is reachable**

```bash
curl -v "https://$NEXT_PUBLIC_SUPABASE_URL/auth/v1/health"
```

Expected: 200 with `{"name":"supabase_auth","openid_configuration":"..."}`

**3. Test auth endpoints directly**

```bash
# Check if the Supabase REST API is up
curl -v "https://$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
```

**4. Check middleware behavior**

```bash
# Visit any protected route in browser
# Open DevTools > Network tab
# Look for redirect to / (home) when should be on /wishlist
```

**5. Verify cookie session**

```bash
# In browser DevTools > Application > Cookies
# Check for sb-<project-ref>-auth-token cookie
# If missing: auth session is lost
```

### Mitigation

1. **If Supabase-wide outage:**
   - Monitor https://status.supabase.com for ETA
   - Post notice on app: "Authentication temporarily unavailable"
   - Protected routes (`/wishlist`, `/alerts`, `/playlists`, `/profile`) will redirect to home

2. **If project-specific issue (bad config):**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Regenerate anon key in Supabase Dashboard > Settings > API
   - Update both env vars in Vercel

3. **If middleware is blocking incorrectly:**
   - Check `src/middleware.ts` for issues
   - `updateSession` from `@/utils/supabase/middleware.ts` handles cookie refresh
   - Error in middleware can cause infinite redirect loops (see [Middleware Auth Loop](#playbook-middleware-auth-loop))

4. **Bypass auth for emergency read access:**
   ```bash
   # Temporarily allow public access to wishlist (NEVER do this in production permanently)
   # Adjust middleware matcher in src/middleware.ts
   ```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Supabase support ticket via https://supabase.com/dashboard/support
- **If outage > 1 hour:** Consider switching to fallback auth provider (requires code changes)

---

## Playbook: CheapShark API Down

**Severity:** HIGH
**Service:** Price data, game details, deal listings
**Description:** CheapShark API (primary data source) is unavailable. App falls back to cached/stale data.

### Symptoms
- All deals show "no data" or empty state
- Server logs: `CheapShark API error: 503` or `fetch failed`
- `getDealsAction` returns `fallbackDeals`
- Direct curl to CheapShark fails

### Debugging

**1. Verify CheapShark status**

```bash
curl -v https://www.cheapshark.com/api/1.0/deals?pageSize=1
```

Expected: 200 with JSON. Any 5xx or timeout = CheapShark down.

Check CheapShark on social/down-detector:
```bash
curl -s "https://downforeveryoneorjustme.com/cheapshark.com"
```

**2. Check response time**

```bash
time curl -s "https://www.cheapshark.com/api/1.0/games?id=1" > /dev/null
```

If > 5 seconds: CheapShark is severely degraded.

**3. Check fallback data freshness**

```bash
# The app uses fallbackDeals when CheapShark is down
# Check src/data/fallbackDeals.ts for hardcoded deals
wc -l src/data/fallbackDeals.ts
```

**4. Verify cached data in DB**

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*), MAX(updated_at) FROM games;"
psql "$DATABASE_URL" -c "SELECT COUNT(*), MAX(recorded_at) FROM price_history;"
```

### Mitigation

1. **If CheapShark is temporarily down:**
   - No immediate action needed — `getDealsAction` and `getDeals` auto-fallback to `fallbackDeals`
   - Homepage ISR cache (`revalidate: 3600`) serves cached pages for 1 hour
   - After cache expires, pages show fallback data (may be significantly stale)

2. **If extended outage (> 2 hours):**
   - Consider proxying through cache. Serve from DB instead of CheapShark:
   ```bash
   # Manual: update ISR revalidation to longer period
   # In src/app/page.tsx, change revalidate from 3600 to 86400
   ```

3. **Cron impact:**
   - Price ingestion cron will fail (logged as `CheapShark API error`)
   - No action needed — retries on next 4h schedule
   - Alert checking cron will also fail for CheapShark-dependent lookups

### Escalation
- **1st line:** Developer on-call
- **2nd line:** CheapShark has no official support — wait for recovery
- **If outage > 24 hours:** Evaluate alternative data sources or cache CheapShark data in DB more aggressively

---

## Playbook: Typesense Search Down

**Severity:** HIGH
**Service:** Search functionality
**Description:** Typesense server is unreachable. Search queries fall back to CheapShark API.

### Symptoms
- Search returns no results or errors
- Slow search (CheapShark fallback is slower than Typesense)
- `searchGamesAction` error logs: `Typesense connection timeout`
- `curl` to Typesense health endpoint fails

### Debugging

**1. Check Typesense health**

```bash
curl -v http://localhost:8108/health
```

If cloud-hosted:

```bash
curl -v https://$TYPESENSE_HOST/health \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY"
```

**2. Check Typesense connectivity from app**

```bash
# Test the exact URL the app uses
curl -v "$NEXT_PUBLIC_TYPESENSE_URL/health" \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY"
```

**3. Check collection exists**

```bash
curl -s "https://$TYPESENSE_HOST/collections/games" \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY" | jq '.num_documents'
```

**4. Test search query directly**

```bash
curl -s "https://$TYPESENSE_HOST/collections/games/documents/search?q=zelda&query_by=title" \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY" | jq '.found'
```

**5. Verify fallback works**

```bash
# Check that CheapShark search still works when Typesense is down
curl -s "https://www.cheapshark.com/api/1.0/games?title=zelda&limit=5" | jq '.'
```

### Mitigation

1. **If Typesense process crashed (self-hosted):**

```bash
# Restart Typesense
docker restart typesense
# Or if bare-metal:
sudo systemctl restart typesense
```

2. **If Typesense is unreachable (cloud):**
   - Check Typesense Cloud dashboard for incidents
   - Verify firewall rules allow the app IP
   - Check if TLS cert has expired

3. **Enable CheapShark fallback (default behavior):**
   - `searchGamesAction` already falls back to CheapShark when `TYPESENSE_ADMIN_KEY` is empty
   - To force fallback temporarily, clear the env var:
   ```bash
   vercel env rm TYPESENSE_ADMIN_KEY production
   vercel --prod
   ```

4. **Restore Typesense from backup:**

```bash
# Recreate collection
curl -X POST "https://$TYPESENSE_HOST/collections" \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "games","fields": [{"name": "gameID","type": "string"},{"name": "title","type": "string"},{"name": "thumb","type": "string"},{"name": "cheapest","type": "string"},{"name": "cheapestPrice","type": "float"},{"name": "metacriticScore","type": "int32","optional": true},{"name": "steamRating","type": "int32","optional": true}],"default_sorting_field": "cheapestPrice"}'

# Trigger reindex
curl -X GET "https://game-deals.vercel.app/api/cron/reindex-typesense" \
  -H "authorization: Bearer $CRON_SECRET"
```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Typesense Cloud support (if managed)
- **Fallback:** CheapShark API search always works as secondary option

---

## Playbook: Vercel Deployment Failure

**Severity:** HIGH
**Service:** CI/CD pipeline
**Description:** `pnpm build` fails on Vercel or `pnpm check` CI fails. New code cannot reach production.

### Symptoms
- Vercel deployment shows "Error" or "Failed" status
- `pnpm build` fails locally
- CI (GitHub Actions) fails on lint, tsc, or build step
- Runtime errors after successful deployment

### Debugging

**1. Check build logs**

```bash
# Vercel CLI
vercel logs game-deals --since=1h
```

Or Vercel Dashboard > Deployments > [failed] > Build Logs.

**2. Reproduce locally**

```bash
pnpm build
```

If build fails, check the error output. Common causes:
- TypeScript errors
- Missing env vars (build needs `.env.local` or Vercel env)
- Biome lint errors (CI check)

**3. Verify env vars**

```bash
# Check which env vars are set in Vercel
vercel env ls production

# Compare with required vars:
# DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
# CRON_SECRET, TYPESENSE_ADMIN_KEY, NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
# NEXT_PUBLIC_TYPESENSE_URL, SUPABASE_SERVICE_ROLE_KEY
```

**4. Check CI workflow**

```bash
# GitHub Actions > Actions tab > latest workflow run
# Check which step(s) failed
```

**5. Test TypeScript compilation**

```bash
pnpm exec tsc --noEmit
```

### Mitigation

1. **If env vars are missing:**

```bash
# Auto-copy from .env.example (for local dev)
cp .env.example .env.local

# For Vercel, add missing vars
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... repeat for all required vars
vercel --prod
```

2. **If TypeScript errors:**
   - Fix the errors locally
   - Run `pnpm exec tsc --noEmit` to verify
   - Commit and re-deploy

3. **If build size exceeds Vercel limit (50MB serverless):**
   Check `.vercel/output` size. Optimize:
   - Remove unused dependencies (`pnpm knip` to find them)
   - Slim down `node_modules` with `next.config.js` `serverExternalPackages`

4. **Rollback to last known-good deployment:**

```bash
# List deployments to find the last good one
vercel list

# Re-deploy the last good deployment
vercel rollback <deployment-id>
```

Or via Vercel Dashboard:
```
Deployments > [last good] > ⋮ > Promote to Production
```

5. **Skip CI for hotfix (use with extreme caution):**
   ```bash
   git commit --allow-empty -m "chore: force deploy [skip ci]"
   git push
   ```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Vercel support (build infrastructure issues)
- **If rollback fails:** Manual DNS switch to backup hosting (requires pre-configuration)

---

## Playbook: Env Key Rotation (Security)

**Severity:** CRITICAL
**Service:** All services (auth, DB, search, cron)
**Description:** A secret key (Supabase service role key, CRON_SECRET, TYPESENSE_ADMIN_KEY) is leaked via commit, log, or GitHub. Immediate rotation required.

### Symptoms
- GitGuardian alert (email or dashboard)
- Unauthorized API access detected
- Secret found in public commit or PR comment
- `git leaks` or `fallow:audit` flags a credential

### Debugging

**1. Identify which key was leaked**

```bash
# Check recent commits for secrets
git log --all --oneline --diff-filter=A -n 20

# Search commit history for exposed keys
git log --all -p | grep -i "sb_secret\|CRON_SECRET\|TYPESENSE_ADMIN\|SUPABASE_SERVICE_ROLE"
```

**2. Check if the leaked key is still active**

```bash
# Test Supabase service role key
curl -s -o /dev/null -w "%{http_code}" "https://$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: <LEAKED_KEY>"
```

If 200: key is active and must be rotated immediately.

**3. Search for the key across the codebase**

```bash
# Exclude .env files
grep -r "<LEAKED_KEY_PREFIX>" --include='*.{ts,tsx,js,json,yml,yaml,md}' .
```

**4. Check GitHub for exposed key**

```bash
# Navigate to GitHub > Settings > Security > Secret scanning > Alerts
```

### Mitigation

**1. Immediately rotate the leaked key**

For **Supabase Service Role Key:**
```
Supabase Dashboard > Project Settings > API > Service Role Key > Revoke & Regenerate
```

For **CRON_SECRET:**
```
# Generate a new random secret
openssl rand -hex 32
# Update in Vercel
vercel env rm CRON_SECRET production
vercel env add CRON_SECRET production
```

For **Typesense Admin Key:**
```
Typesense Dashboard > API Keys > Generate new key
# Or via API:
curl -X POST "https://$TYPESENSE_HOST/keys" \
  -H "X-TYPESENSE-API-KEY: $OLD_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description":"Admin key","actions":["*"],"collections":["*"]}'
```

**2. Update all environments**
- Vercel production env vars
- Vercel preview env vars
- Local `.env.local` files
- CI secrets (GitHub Actions)

**3. Remove leaked key from git history**

```bash
# Use git filter-repo to purge the key from all commits
# WARNING: This rewrites history. Coordinate with the team.
pip install git-filter-repo
git filter-repo --force --replace-text <(echo "LEAKED_KEY") --path .env.example
git push --force --all
```

**4. Verify rotation**

```bash
# Confirm old key is revoked
curl -s -o /dev/null -w "%{http_code}" "https://$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: <OLD_KEY>"
# Expected: 401

# Confirm new key works
curl -s -o /dev/null -w "%{http_code}" "https://$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: <NEW_KEY>"
# Expected: 200
```

**5. Prevent future leaks**

```bash
# Run fallow audit on pre-commit
pnpm fallow:audit

# Add .env files to .gitignore (verify they're there)
grep ".env.local" .gitignore
grep ".env\*" .gitignore
```

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Security team (if applicable)
- **Immediate:** Block the commit containing the leak (if in PR)
- **If key used by attacker:** Audit Supabase audit logs for unauthorized queries

---

## Playbook: OOM Prevention (Dev)

**Severity:** LOW
**Service:** Developer workstation
**Description:** Next.js 16 + Turbopack + Tailwind v4 dev server allocates ~30GB virtual memory, triggering OOM killer on Linux with `overcommit_memory=0`.

### Symptoms
- Dev server crashes with `Killed` signal
- `dmesg` shows `Out of memory: Kill process next-server`
- `free -h` shows near-zero available memory
- Chromium browser also crashes

### Debugging

**1. Check if OOM killed the process**

```bash
dmesg | grep -i "oom\|killed" | tail -5
```

**2. Check memory pressure**

```bash
free -h
# Look at "available" column — should be > 1GB
```

**3. Check VSZ vs RSS**

```bash
ps aux | grep "next-server\|node" | awk '{printf "PID %s: RSS %s MB, VSZ %s MB\n", $2, $6/1024, $5/1024}'
```

If VSZ >> 10000 MB but RSS < 2000 MB: virtual memory allocation (Linux `overcommit_memory=0` counts VSZ against OOM).

**4. Check overcommit setting**

```bash
cat /proc/sys/vm/overcommit_memory
# 0 = heuristic (counts VSZ toward commit limit — problematic)
# 1 = always allow (no OOM accounting based on VSZ)
# 2 = strict (never use)
```

### Mitigation

**1. Adjust overcommit setting (kernel-level fix)**

```bash
# Allow overcommit to prevent VSZ from triggering OOM
sudo sysctl vm.overcommit_memory=1
# Make permanent
echo 'vm.overcommit_memory=1' | sudo tee -a /etc/sysctl.conf
```

**2. Kill orphaned processes**

```bash
# After OOM events, orphan processes may linger
pkill -f "next-server" && pkill -f "chromium"
```

**3. Reduce Turbopack memory usage**

```bash
# Start dev with memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm dev
```

**4. Use pnpm build && pnpm start instead of pnpm dev (for E2E tests)**

```bash
# Instead of:
# pnpm dev && pnpm test:e2e

# Use:
pnpm build && pnpm start &
sleep 5
pnpm test:e2e
```

**5. Limit parallel subagents**

Do not launch `pnpm dev` inside a subagent running in parallel with others. Max 3 parallel subagents when any spawns child processes.

### Escalation
- **1st line:** Developer workstation troubleshooting
- **2nd line:** Increase system RAM or configure swap
- **If persistent:** Use `pnpm build && pnpm start` instead of dev mode

---

## Playbook: Middleware Auth Loop

**Severity:** HIGH
**Service:** User authentication, page routing
**Description:** Supabase middleware (`updateSession`) enters an infinite redirect loop. Users cannot access any protected routes and may be redirected repeatedly.

### Symptoms
- Browser shows "redirect loop" or "too many redirects" error
- Protected routes (`/wishlist`, `/alerts`, `/playlists`, `/profile`) never finish loading
- Network tab shows repeated 307/302 redirects
- Console shows session refresh errors

### Debugging

**1. Reproduce the loop**

```bash
# Open browser DevTools > Network tab
# Visit /wishlist
# Observe the redirect chain: /wishlist → / → /wishlist → / ...
```

**2. Check middleware response headers**

```bash
curl -v http://localhost:3000/wishlist 2>&1 | head -40
```

Look for repeated `location:` headers.

**3. Check Supabase auth session**

```bash
# In browser DevTools > Application > Cookies
# Check for sb-<project-ref>-auth-token
# If cookie exists but is malformed/expired, middleware may fail to parse it
```

**4. Verify `updateSession` implementation**

Check `src/utils/supabase/middleware.ts` for:
- Cookie refresh logic
- Session token parsing
- Redirect conditions

**5. Check if middleware runs on ALL routes**

```
src/middleware.ts: matcher includes all routes except static files
```

Cron routes (`/api/cron/*`) are excluded from the auth middleware matcher in `src/middleware.ts` via negative lookahead (`api/cron`). If you add new cron routes, ensure they remain excluded.

### Cron Runner Migration (Sprint 15)

As of Sprint 15, cron jobs run on **GitHub Actions** (`.github/workflows/cron.yml`), not Vercel Cron Jobs, due to Vercel Hobby plan limits (1 execution per cron per day).

**Current setup:**
- 3 schedules defined in `.github/workflows/cron.yml` (same timing as before)
- `vercel.json` crons array is empty (all scheduling handled by GH Actions)
- The API endpoints (`/api/cron/*`) still run on Vercel — called via HTTP from GH Actions with `CRON_SECRET` auth
- Endpoints are still excluded from auth middleware

**Adding a new cron job:**
1. Add the job to `.github/workflows/cron.yml` (same format as existing jobs)
2. Ensure the Vercel endpoint exists (e.g., `src/app/api/cron/<name>/route.ts`)
3. The endpoint must use `verifyCronAuth(request)` for auth
4. No changes needed to `vercel.json`

**Manual trigger:**
```bash
# Trigger all cron jobs
gh workflow run cron.yml

# Trigger a specific job (if workflow_dispatch inputs configured)
gh workflow run cron.yml
```

### Mitigation

**1. Clear auth cookies (immediate user fix)**

```bash
# User: clear browser cookies & cache for the domain
# Or: visit /logout endpoint
```

**2. Disable middleware temporarily (emergency)**

Edit `src/middleware.ts`:

```typescript
// Comment out the middleware or adjust matcher
export const config = {
  matcher: [],  // Empty = middleware disabled
};
```

**WARNING:** This disables auth protection for all routes. Re-enable after debugging.

**3. Adjust middleware matcher to exclude API routes**

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
```

**4. Check Supabase session cookie TTL**

```
Supabase Dashboard > Authentication > Settings > Session duration
```
If session duration is too short, cookies expire faster than they can be refreshed.

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Supabase support (if `updateSession` has breaking changes after SDK update)
- **If persistent:** Switch middleware to simpler session verification pattern

---

## Playbook: Affiliate Redirect Breakage

**Severity:** LOW
**Service:** Affiliate link clicks
**Description:** `/out/[storeId]/[gameSlug]` redirects fail or point to wrong stores. Affiliate revenue is lost.

### Symptoms
- Clicking "Buy" buttons results in 404 or wrong store
- Browser shows error when following /out/ links
- Affiliate click logging shows 0 clicks (suspicious)

### Debugging

**1. Test an affiliate redirect**

```bash
# Replace storeId and slug with real values
curl -v http://localhost:3000/out/1/zelda-breath-of-the-wild 2>&1 | grep "location:"
```

Expected: 307 redirect to the store URL with affiliate params.

**2. Check store allowlist**

Check `src/app/out/[storeId]/[gameSlug]/route.ts` for store ID validation.

Verify store IDs match `STORE_FAVICON_MAP` in `src/constants/stores.ts`:

```bash
grep "STORE_FAVICON_MAP" src/constants/stores.ts
```

**3. Check affiliate config**

Check `src/lib/affiliate-config.ts` for:
- Base URLs
- Affiliate parameters
- Store-to-affiliate mapping

**4. Verify click logging**

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM affiliate_clicks;"
psql "$DATABASE_URL" -c "SELECT store_id, COUNT(*) FROM affiliate_clicks GROUP BY store_id ORDER BY COUNT(*) DESC;"
```

### Mitigation

1. **If store ID not in allowlist:**
   - Add missing store ID to `src/app/out/[storeId]/[gameSlug]/route.ts`
   - Test: `curl -v http://localhost:3000/out/<new-id>/test-game`

2. **If affiliate URL params are wrong:**
   - Update `src/lib/affiliate-config.ts` with correct URL template
   - Verify with: `curl -v http://localhost:3000/out/1/test-game`

3. **If redirect returns 404:**
   - Check the game slug validation regex
   - Test with decoded slug: `curl -v "http://localhost:3000/out/1/zelda-breath-of-the-wild"`

4. **If click logging is down:**
   - Check `affiliate_clicks` table schema in `src/db/schema/affiliates.ts`
   - Run migration if table doesn't exist: `pnpm db:migrate`

### Escalation
- **1st line:** Developer on-call
- **2nd line:** Store affiliate program manager (if commission structure changed)
- **No escalation needed:** Low severity — users can still navigate to stores manually

---

## Incident Response Quick Reference

### Who to Contact

| Role | Contact | Availability |
|------|---------|-------------|
| Developer on-call | (Assign via rotation) | 24/7 for CRITICAL |
| Supabase Support | https://supabase.com/dashboard/support | Business hours |
| Vercel Support | https://vercel.com/support | Business hours (Enterprise: 24/7) |

### Severity Definitions

| Severity | Response Time | Impact |
|----------|--------------|--------|
| CRITICAL | < 15 minutes | Complete service outage, data loss, security breach |
| HIGH | < 1 hour | Major feature broken, degraded experience for all users |
| MEDIUM | < 4 hours | Feature broken for subset of users |
| LOW | < 24 hours | Minor issue, workaround exists, dev environment only |

### Data Sources

| Resource | URL / Command |
|----------|---------------|
| Vercel Dashboard | https://vercel.com/<team>/game-deals |
| Vercel Logs | `vercel logs game-deals` |
| Supabase Dashboard | https://supabase.com/dashboard/project/<ref> |
| Supabase Status | https://status.supabase.com |
| CheapShark API | https://www.cheapshark.com/api/1.0/ |
| Typesense Dashboard | `http://localhost:8108` or cloud dashboard |
| GitHub Actions | https://github.com/<org>/game-deals/actions |
| DB (psql) | `psql "$DATABASE_URL"` |
| DB (Studio) | `pnpm db:studio` |

### Quick Commands

```bash
# Trigger all cron jobs locally
curl http://localhost:3000/api/cron/ingest-prices -H "authorization: Bearer $CRON_SECRET"
curl http://localhost:3000/api/cron/reindex-typesense -H "authorization: Bearer $CRON_SECRET"
curl http://localhost:3000/api/cron/check-alerts -H "authorization: Bearer $CRON_SECRET"

# Full CI check locally
pnpm check

# Dead code analysis
pnpm knip

# Security audit
pnpm fallow:audit

# Kill stuck processes (OOM)
pkill -f "next-server"
pkill -f "chromium"
```
