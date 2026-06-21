---
title: Data Flow Architecture
type: reference
status: active
scope: project
tags:
  - architecture
  - data-flow
  - request-lifecycle
related:
  - adr/ADR-008-routing-pattern
  - architecture/c4-system-context
updated: "2026-06-21"
---

# Data Flow Architecture

This document describes the five primary data flows in the GameDeals system.
Each flow includes a Mermaid sequence diagram, trigger description, failure
modes, and code locations.

---

## Flow 1: Price Ingestion

Fetches the latest game deals from CheapShark, upserts game records, inserts
deal entries, and records price snapshots for historical tracking.

### Sequence

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron (every 4h)
    participant API as /api/cron/ingest-prices
    participant Action as ingestPricesAction
    participant CS as CheapShark API
    participant DB as PostgreSQL (Drizzle)

    Cron->>API: GET /api/cron/ingest-prices
    Note over API: Header: Authorization: Bearer ${CRON_SECRET}
    API->>API: Validate CRON_SECRET
    alt Invalid secret
        API-->>Cron: 401 Unauthorized
    end
    API->>Action: ingestPricesAction()
    Action->>CS: GET /deals?sortBy=Deal%20Rating&onSale=1&pageSize=100
    CS-->>Action: 100 deals (JSON)
    alt CheapShark error
        Action-->>API: { success: false, error: "CheapShark API error: 5xx" }
        API-->>Cron: 500 Internal Server Error
    end
    Action->>DB: UPSERT games (cheapsharkId unique)
    Note over Action,DB: One upsert per unique gameID<br/>Sets title, thumbUrl, updatedAt
    Action->>DB: INSERT deals (batch)
    Note over Action,DB: gameId, storeId, price, retailPrice,<br/>savings, dealRating, url
    Action->>DB: INSERT price_history (batches of 50)
    Note over Action,DB: gameId, storeId, price, retailPrice, recordedAt
    Action-->>API: { success: true, dealsIngested, gamesUpserted, pricesRecorded }
    API-->>Cron: 200 OK
```

### Trigger

Vercel Cron Job — runs every 4 hours. Configured via `vercel.json` or
Vercel dashboard.

### Failure Modes

| Mode | Symptom | Handling |
|------|---------|----------|
| CRON_SECRET mismatch | Request returns 401 | Cron job retries on next tick |
| CheapShark API down | HTTP 5xx response | Action returns error, no DB writes |
| CheapShark returns empty | `deals.length === 0` | Returns success with zero counts |
| DB connection failure | Drizzle throws | Caught by try/catch, returns error |

### Code Locations

| File | Role |
|------|------|
| `src/app/api/cron/ingest-prices/route.ts` | Cron endpoint, auth check |
| `src/actions/deals.ts` (lines 108-215) | `ingestPricesAction` — fetch + upsert + insert |
| `src/db/schema/games.ts` | Games table schema |
| `src/db/schema/deals.ts` | Deals table schema |
| `src/db/schema/price_history.ts` | Price history table schema |
| `src/services/api.ts` | Client-side CheapShark wrapper (separate from cron) |

---

## Flow 2: Search

Provides live search-as-you-type results via Typesense with automatic
fallback to CheapShark direct API when Typesense is unavailable.

### Sequence

```mermaid
sequenceDiagram
    participant User as Browser User
    participant Navbar as Navbar (client)
    participant TQ as TanStack Query
    participant Action as searchGamesAction (server)
    participant TS as Typesense
    participant CS as CheapShark API

    User->>Navbar: Type in search input
    Navbar->>Navbar: useQueryState('q') update
    Navbar->>Navbar: Debounce 300ms (useEffect)
    Note over Navbar: debouncedQuery set after 300ms idle
    alt query.length >= 3
        Navbar->>TQ: useQuery(['search', debouncedQuery])
        TQ->>Action: searchGamesAction(query, limit=5)
        alt Typesense API key exists
            Action->>TS: GET /collections/games/documents/search
            Note over Action,TS: Query-by: title(weight 100),<br/>developer(50), publisher(50)<br/>Typo tolerance enabled
            TS-->>Action: Matching hits
            Action->>Action: Map hits to {gameID, external, thumb, cheapest}
        else No Typesense key
            Action->>CS: GET /games?title=<query>&limit=5
            CS-->>Action: Raw results
        end
        Action-->>TQ: Results array
        TQ-->>Navbar: Renders dropdown with results
    end
    Note over User,Navbar: On form submit → navigates to /search?q=<query>
```

### Trigger

User input in the Navbar search field. Debounced at 300ms. Minimum query
length of 3 characters. Also triggers on form submission which navigates
to the full `/search` results page.

### Failure Modes

| Mode | Symptom | Handling |
|------|---------|----------|
| Typesense unreachable | `typesenseSearch` throws | Caught in try/catch, returns empty array |
| No Typesense configured | Both key env vars empty | Falls back to CheapShark `/games` endpoint |
| CheapShark also fails | HTTP error or exception | Returns empty array |
| Network timeout | fetch rejects | Caught, empty results shown |

### Code Locations

| File | Role |
|------|------|
| `src/components/Navbar.tsx` (lines 17-40) | Debounce + TanStack Query + dropdown rendering |
| `src/actions/search.ts` (lines 18-43) | `searchGamesAction` — Typesense/CheapShark dispatch |
| `src/lib/typesense.ts` (lines 87-115) | `searchGames` — Typesense HTTP search call |
| `src/app/search/page.tsx` | Full search results page (form target) |

---

## Flow 3: Authentication

Handles user login, session management, and route protection via Supabase
SSR with middleware-enforced access control.

### Sequence

```mermaid
sequenceDiagram
    participant User as Browser User
    participant Navbar as Navbar (client)
    participant AuthModal as AuthModal
    participant SBClient as Supabase Browser Client
    participant SBServer as Supabase SSR Server
    participant MW as Next.js Middleware
    participant Page as Protected Page

    User->>Navbar: Click "Login"
    Navbar->>AuthModal: Open modal
    User->>AuthModal: Enter credentials / OAuth
    AuthModal->>SBClient: supabase.auth.signIn()
    SBClient-->>AuthModal: Session + User
    Note over SBClient: Sets auth cookies (httpOnly)
    AuthModal-->>Navbar: Close modal
    Navbar->>Navbar: onAuthStateChange → setUser()

    User->>Navbar: Navigate to /wishlist
    Navbar->>MW: Request /wishlist
    MW->>SBServer: createServerClient(url, key)
    MW->>SBServer: supabase.auth.getUser()
    SBServer-->>MW: User (or null)
    alt Authenticated
        MW-->>Page: Pass through (supabaseResponse)
    else Not authenticated
        MW-->>User: 302 Redirect to /?auth=required
    end
    Page->>SBServer: createClient() (SSR page)
    SBServer-->>Page: User session (cookies)
```

### Trigger

- **Login flow**: User clicks Login button in Navbar → AuthModal opens
- **Route protection**: Any navigation to `/wishlist`, `/alerts`, `/playlists`,
  or `/profile`

### Failure Modes

| Mode | Symptom | Handling |
|------|---------|----------|
| Supabase env vars missing | `createServerClient` throws | 500 at middleware level |
| Session expired | `getUser()` returns null | Redirect to home with `?auth=required` |
| Cookie parse error | SSR client cannot read cookies | `updateSession` creates new response |
| Auth API down | `getUser()` throws | Propagates as middleware error |

### Code Locations

| File | Role |
|------|------|
| `src/middleware.ts` | Entry point, delegates to `updateSession` |
| `src/utils/supabase/middleware.ts` | `updateSession` — create SSR client, refresh session, protect routes |
| `src/utils/supabase/server.ts` | `createClient` — SSR pages that need session |
| `src/utils/supabase/client.ts` | `createClient` — browser-side Supabase client |
| `src/store/authStore.ts` | Zustand store — lazy-init browser client, listen to auth changes |
| `src/components/Navbar.tsx` (lines 42-81) | Hydrate from SSR, subscribe to auth state |
| `src/components/AuthModal.tsx` | Login UI (email/OAuth) |

---

## Flow 4: Affiliate Redirect

Cloaks outbound affiliate links through a validated redirect pipeline.
Validates store and slug, builds the affiliate URL, logs the click, then
redirects.

### Sequence

```mermaid
sequenceDiagram
    participant User as Browser User
    participant Out as /out/[storeId]/[gameSlug]
    participant Config as affiliate-config
    participant DB as PostgreSQL
    participant AffStore as Affiliate Store

    User->>Out: Click deal → GET /out/7/deal-title-123
    Out->>Config: isValidStoreId("7")
    Out->>Config: isValidGameSlug("deal-title-123")
    alt Invalid storeId (not in affiliateConfig)
        Out-->>User: 302 Redirect to /
    end
    alt Invalid slug (fails regex)
        Out-->>User: 302 Redirect to /
    end
    Out->>DB: SELECT url, storeId FROM deals WHERE storeId = '7' LIMIT 1
    DB-->>Out: Deal URL or null
    Out->>Config: Lookup affiliateConfig["7"]
    Note over Out,Config: baseUrl = https://www.gog.com<br/>params = { affiliate: "gamedeals" }
    Out->>Out: Build final URL with affiliate params
    Out->>Out: Validate hostname against ALLOWED_DOMAINS
    alt Hostname not in allowlist
        Out-->>User: 302 Redirect to / (blocked)
    end
    Out->>DB: INSERT INTO affiliate_clicks (fire-and-forget)
    Note over Out,DB: storeId, gameSlug, ip, timestamp
    Out-->>User: 302 Redirect to affiliate URL
```

### Trigger

User clicks a deal card or deal link on any page. The link points to
`/out/[storeId]/[gameSlug]` with a validated slug.

### Failure Modes

| Mode | Symptom | Handling |
|------|---------|----------|
| Invalid storeId | `isValidStoreId` returns false | Redirect to `/` (safe fallback) |
| Invalid slug format | `isValidGameSlug` returns false | Redirect to `/` |
| Deal URL not in DB | `deal?.url` is null | Falls back to `config.baseUrl` |
| DB query throws | `db.execute` catches | Logs error, uses baseUrl |
| Hostname not allowed | `ALLOWED_DOMAINS.has()` false | Redirect to `/`, logs warning |
| Affiliate click insert fails | `.catch(() => {})` | Silent — fire-and-forget pattern |

### Code Locations

| File | Role |
|------|------|
| `src/app/out/[storeId]/[gameSlug]/route.ts` | Redirect handler — validation, URL building, logging |
| `src/lib/affiliate-config.ts` | `affiliateConfig` map, `ALLOWED_DOMAINS`, validators |
| `src/db/schema/affiliates.ts` | `affiliate_clicks` and `affiliate_links` schemas |

---

## Flow 5: Price Alert Check

Periodically checks all active price alerts against current CheapShark
prices, records the latest price, and triggers notifications when the
target threshold is met.

### Sequence

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron (every 4h)
    participant API as /api/cron/check-alerts
    participant SB as Supabase (price_alerts)
    participant CS as CheapShark API
    participant Notify as Notification Log

    Cron->>API: GET /api/cron/check-alerts
    Note over API: Header: Authorization: Bearer ${CRON_SECRET}
    API->>API: Validate CRON_SECRET
    alt Invalid secret
        API-->>Cron: 401 Unauthorized
    end
    API->>SB: SELECT * FROM price_alerts
    SB-->>API: All alert records
    alt No alerts
        API-->>Cron: 200 { message: "No alerts to check" }
    end
    API->>API: Deduplicate by gameId
    loop Each unique gameId
        API->>CS: GET /games?id=<gameID>
        CS-->>API: Game data with deals[]
        alt CheapShark unavailable
            API->>API: Skip to next gameId
        end
        API->>API: Parse currentBestPrice from deals[0].price
        API->>SB: UPDATE price_alerts SET currentPrice = <price> WHERE gameId = <id>
        API->>API: Filter alerts where currentBestPrice <= targetPrice
        alt Price below threshold
            API->>Notify: console.log TRIGGERED
            Note over API,Notify: Future: push notification,<br/>email, or in-app alert
        end
    end
    API-->>Cron: 200 { processed: N, triggered: M, details: [...] }
```

### Trigger

Vercel Cron Job — runs every 4 hours.

### Failure Modes

| Mode | Symptom | Handling |
|------|---------|----------|
| CRON_SECRET mismatch | 401 | Cron retries next tick |
| price_alerts table empty | Empty result set | Returns 200 with "No alerts" message |
| CheapShark API error (per game) | `res.ok` false | `continue` — skip that game, process others |
| Game has no deals | `deals.length === 0` | `continue` — skip |
| DB update fails | `updateError` non-null | Logs error, alert processed with old price |

### Code Locations

| File | Role |
|------|------|
| `src/app/api/cron/check-alerts/route.ts` | Full alert check logic |
| `src/db/schema/price_history.ts` (lines 30-47) | `priceAlerts` table schema |

---

## Diagram Summary

| Flow | Diagram Type | Primary External Dependency |
|------|-------------|----------------------------|
| 1. Price Ingestion | Sequence | CheapShark API |
| 2. Search | Sequence | Typesense / CheapShark API |
| 3. Auth | Sequence | Supabase Auth |
| 4. Affiliate Redirect | Sequence | Affiliate store domains |
| 5. Alert Check | Sequence | CheapShark API |

All diagrams use [Mermaid](https://mermaid.js.org/) `sequenceDiagram` syntax
and render natively in GitHub-flavored markdown.
