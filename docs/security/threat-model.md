# GameDeals — STRIDE Threat Model

**Version:** 1.0  
**Date:** 2026-06-13  
**Scope:** GameDeals platform (Next.js 16, Supabase SSR, Drizzle ORM, Typesense, CheapShark API)  
**Methodology:** STRIDE per threat category + DREAD severity scoring

---

## Table of Contents

1. [Architecture Overview & Trust Boundaries](#1-architecture-overview--trust-boundaries)
2. [Threat Table (STRIDE)](#2-threat-table-stride)
3. [DREAD Scoring Summary](#3-dread-scoring-summary)
4. [Trust Boundary Details](#4-trust-boundary-details)
5. [Past Incidents](#5-past-incidents)
6. [Review Cadence](#6-review-cadence)

---

## 1. Architecture Overview & Trust Boundaries

### Data Flow Diagram (Simplified)

```
                       ┌─────────────────────────────────────┐
                       │           Browser (User)             │
                       │  (Client-side JS, Cookies, DOM)      │
                       └──────────┬──────────────────┬────────┘
                                  │                  │
                    [TB1] HTTP    │    [TB1] HTTP     │
                    Cookies/JWT   │    CSRF/XSS       │
                                  │    surface         │
                                  v                  v
                       ┌─────────────────────────────────────┐
                       │         Next.js (Server)             │
                       │  App Router + Server Actions         │
                       │  + Middleware (auth refresh)          │
                       └──┬───────┬──────┬───────┬────────────┘
                          │       │      │       │
                [TB2]     │[TB3]  │[TB4] │[TB5]  │
                  DB      │ Cron  │ Search│ Aff.  │
                          │       │      │       │
                          v       v      v       v
              ┌─────┐ ┌──────┐ ┌──────┐ ┌──────────┐
              │Sup. │ │Post- │ │Types.│ │CheapShark│
              │base │ │gres  │ │ense  │ │API       │
              │Auth │ │(DB)  │ │      │ │          │
              └─────┘ └──────┘ └──────┘ └──────────┘
```

### Trust Boundaries

| ID | Boundary | Type | Description |
|----|----------|------|-------------|
| **TB1** | Browser ↔ Next.js | Network (HTTPS) | HTTP requests carrying cookies, form data, search queries. Client-side JS can be modified by user. |
| **TB2** | Next.js ↔ Supabase/Postgres | Network (TLS) | Database queries via Drizzle ORM (parameterized). Supabase Auth via anon key (RLS-enforced) or service role key (admin). |
| **TB3** | Vercel Cron ↔ Next.js API | Network (HTTPS + Bearer) | Cron triggers `/api/cron/*` endpoints. Authenticated via `CRON_SECRET` Bearer token. |
| **TB4** | Next.js ↔ Typesense | Network (TLS) | Server: admin key (full CRUD). Client: search-only key (read-only). Separate keys enforced. |
| **TB5** | Next.js ↔ CheapShark API | Network (HTTPS) | Outbound fetch to external API. No auth needed (public API). Data validated before DB insert. |

---

## 2. Threat Table (STRIDE)

### T1 — Spoofing (Authentication Bypass)

| # | Component | Data Flow | Threat Description | STRIDE | Risk | Mitigation |
|---|-----------|-----------|--------------------|--------|------|------------|
| T1.1 | Middleware | TB1 | Attacker crafts fake `sb-*` auth cookie to impersonate user. | Spoofing | High | Supabase SSR `getUser()` validates session server-side via `@supabase/ssr`. Cookie signature verified by Supabase Auth. |
| T1.2 | Middleware | TB1 | Expired session token reused after logout. | Spoofing | Medium | `updateSession()` calls `supabase.auth.getUser()` on every request — token refresh handled by Supabase. |
| T1.3 | Auth Store | TB1 | Client-side `isLoggedIn` flag manipulated in Zustand store. | Spoofing | Low | `isLoggedIn` is derived from server-validated user object. All protected routes re-check server-side via middleware. |

### T2 — Tampering (SQL Injection / CSRF / Input Manipulation)

| # | Component | Data Flow | Threat Description | STRIDE | Risk | Mitigation |
|---|-----------|-----------|--------------------|--------|------|------------|
| T2.1 | Drizzle ORM | TB2 | Malicious input passed to raw `sql` template literal in `deals.ts:222` (`sql\`SELECT * FROM get_daily_prices(${gameId}, ${days})\``). | Tampering | Medium | Drizzle's `sql` tag template literals use parameterized queries — `${gameId}` is bound as parameter, not interpolated into SQL string. However, the helper functions `sql` from Drizzle are tagged templates, so they ARE safe if used correctly as tagged literals. |
| T2.2 | Affiliate Redirect | TB1 | Open redirect via manipulated `storeId` or `gameSlug` params in `/out/[storeId]/[gameSlug]`. | Tampering | High | `isValidStoreId()` validates against static allowlist (`/^\d{1,3}$/` + `storeId in affiliateConfig`). `isValidGameSlug()` uses regex `/^[a-zA-Z0-9_-]{1,100}$/`. `ALLOWED_DOMAINS` set blocks redirect to non-allowlisted hosts. **Mitigation in depth:** URL validated against allowlist at line 49. |
| T2.3 | Affiliate Redirect | TB2 | SQL injection via `storeId` in `out` route raw SQL (`WHERE "storeId" = ${storeId}`). | Tampering | High | `storeId` pre-validated by `isValidStoreId` regex before reaching query. Drizzle `sql` tag parameterizes. Combined: safe. |
| T2.4 | Cron Endpoints | TB3 | CRON_SECRET brute-forced via timing attack. | Tampering | Low | Bearer comparison uses standard `!==` (not timing-safe). Risk mitigated by: (a) secret length recommendation (≥32 chars), (b) Vercel Cron network-level restriction in production. |

### T3 — Repudiation (Audit Trail)

| # | Component | Data Flow | Threat Description | STRIDE | Risk | Mitigation |
|---|-----------|-----------|--------------------|--------|------|------------|
| T3.1 | All | TB1-TB5 | No audit log of admin actions (price ingestion, Typesense reindex, alert checking). | Repudiation | Medium | No current audit table. Cron jobs log to `console.log` only (Vercel Logs ephemeral). **Recommendation:** Add `audit_logs` table for admin/cron actions. |
| T3.2 | Affiliate Clicks | TB5 | No user attribution for affiliate clicks (only IP logged). | Repudiation | Low | Affiliate click logs exist (`affiliate_clicks` table) but lack authenticated user ID. Tracks `ip`, `storeId`, `gameSlug`, `timestamp`. |
| T3.3 | Price Alerts | TB2 | Alert trigger events not persisted — only logged to console and returned in response. | Repudiation | Low | `check-alerts` route logs triggered alerts to stdout. No persistent notification history table. |

### T4 — Information Disclosure (Key Exposure / XSS)

| # | Component | Data Flow | Threat Description | STRIDE | Risk | Mitigation |
|---|-----------|-----------|--------------------|--------|------|------------|
| T4.1 | Typesense | TB4 | `TYPESENSE_ADMIN_KEY` leaked to client bundle. | Info Disclosure | Critical | Admin key only used server-side (`createAdminClient()`, `indexGame()`, `indexGamesBatch()`). Client uses `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` (read-only, search-only). **No `NEXT_PUBLIC_` prefix on admin key** — Next.js tree-shakes server-only env vars from client bundle. |
| T4.2 | Supabase Service Role | TB2 | `SUPABASE_SERVICE_ROLE_KEY` leaked or used in client-side code. | Info Disclosure | Critical | Service role key is **not** prefixed with `NEXT_PUBLIC_`. It is only used via `process.env.SUPABASE_SERVICE_ROLE_KEY` in server actions and cron routes. **However**, the key is currently exposed in `.env.example` as a placeholder — this is safe because `.env.example` is not deployed. |
| T4.3 | Past Incident | Git | **Service role key leaked in past commits** (see AGENTS.md Session Learnings PR #10). | Info Disclosure | Critical (past) / High (current) | Key was committed to git history. Rotated after GitGuardian alert. **Verification required:** confirm key rotation via `curl -s -o /dev/null -w "%{http_code}" <supabase-url>/rest/v1/ --header "apikey: <KEY>"`. Old leaked key still accepted requests until rotated. |
| T4.4 | XSS — Search | TB1 | Malicious search query executed as HTML. | Info Disclosure | Medium | Search terms flow through Server Actions → Typesense/CheapShark → JSON response. React DOM auto-escapes rendered text. No `dangerouslySetInnerHTML` used in search components. |
| T4.5 | XSS — Game Details | TB1 | CheapShark API returns game title/description with embedded scripts. | Info Disclosure | Medium | Data rendered as React text nodes (auto-escaped). No raw HTML rendering of CheapShark data. Game thumbnails use `<img>` with validated URLs. |
| T4.6 | Debug Logging | TB1-TB5 | Console error messages may leak env vars, query details, or stack traces. | Info Disclosure | Low | Generic error messages in production (e.g., `'Generic error'`). Error details logged server-side only. Client receives sanitized responses. |

### T5 — Denial of Service

| # | Component | Data Flow | Threat Description | STRIDE | Risk | Mitigation |
|---|-----------|-----------|--------------------|--------|------|------------|
| T5.1 | CheapShark API | TB5 | Rate-limiting by CheapShark if too many requests sent. | DoS | Low | `revalidate: 3600` cache on `getDealsAction` and `getGameAction`. Cron job runs every 4h with single batch request (100 deals). ISR home page caches for 1h. |
| T5.2 | Database | TB2 | Expensive queries or bulk inserts overwhelm Postgres. | DoS | Medium | Batch inserts in chunks of 50 (price_history). Indexes on `deals_gameId_idx`, `deals_store_game_idx`, `deals_rating_idx`, `ph_game_store_recorded_idx`, `pa_user_game_unique`. Drizzle ORM protects against N+1 via eager loading. |
| T5.3 | Typesense | TB4 | Unauthenticated search flooding. | DoS | Low | Typesense search uses `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` (not secret but rate-limited). Server-side indexing uses admin key. No rate limiting implemented — rely on Typesense host-level controls. |
| T5.4 | Cron Jobs | TB3 | Malicious actor triggers `/api/cron/*` repeatedly. | DoS | Medium | `CRON_SECRET` Bearer token protection prevents unauthorized invocation. In Vercel production, cron endpoints additionally restricted to Vercel Cron system. |

### T6 — Elevation of Privilege

| # | Component | Data Flow | Threat Description | STRIDE | Risk | Mitigation |
|---|-----------|-----------|--------------------|--------|------|------------|
| T6.1 | Supabase Service Role | TB2 | Server code using service role key can bypass all RLS policies and read/write any table. | Elevation of Privilege | Critical | Service role key used in price ingestion (`ingestPricesAction`), alert checking (`check-alerts`), and potentially other server actions. **Any compromise of server-side code execution** gives full database access. Mitigation: server-only env var (no `NEXT_PUBLIC_` prefix), never exposed to client. |
| T6.2 | Cron Endpoints | TB3 | `CRON_SECRET` guessed or leaked allows triggering admin operations (price ingest, Typesense reindex, alert check). | Elevation of Privilege | High | All three cron routes validate `Authorization: Bearer <CRON_SECRET>` header. Secret should be ≥32 random characters. **No network-level IP restriction** in dev/staging — only Vercel production has built-in cron source filtering. |
| T6.3 | User Roles | TB2 | Normal user escalates to `mod` or `admin` role. | Elevation of Privilege | Low | Role stored in `profiles.role` Drizzle enum (`user`, `mod`, `admin`). No current code exposes role change endpoint. RLS policies not fully mapped — dependency on Supabase RLS configuration. |
| T6.4 | API Client | TB1 | Client-side API calls with manipulated session to access other users' data. | Elevation of Privilege | Medium | Wishlist, alerts, and profile data scoped by `userId` from authenticated session. Supabase RLS enforces user-scoped access. Server code also filters by authenticated user. |

---

## 3. DREAD Scoring Summary

DREAD scale: 1 (low) to 10 (high) per category.

| Threat | Damage | Reproducibility | Exploitability | Affected Users | Discoverability | **Total** | **Risk** |
|--------|--------|-----------------|---------------|---------------|----------------|-----------|----------|
| T1.1 — Auth bypass (cookie forgery) | 9 | 2 | 3 | 10 | 4 | **28** | High |
| T1.2 — Expired token reuse | 5 | 3 | 2 | 8 | 3 | **21** | Medium |
| T1.3 — Client state manipulation | 2 | 8 | 9 | 5 | 5 | **29** | High* |
| T2.1 — SQL injection (Drizzle raw) | 8 | 3 | 3 | 8 | 4 | **26** | High* |
| T2.2 — Open redirect | 6 | 5 | 4 | 7 | 6 | **28** | High |
| T2.3 — SQLi in affiliate route | 8 | 3 | 2 | 6 | 3 | **22** | Medium |
| T2.4 — CRON_SECRET timing attack | 3 | 1 | 1 | 2 | 1 | **8** | Low |
| T3.1 — No audit log | 4 | 8 | 8 | 3 | 7 | **30** | High |
| T3.2 — Affiliate click traceability | 2 | 8 | 8 | 2 | 7 | **27** | Medium |
| T3.3 — Alert history missing | 1 | 8 | 8 | 2 | 6 | **25** | Medium |
| T4.1 — Admin key in client bundle | 10 | 1 | 1 | 10 | 1 | **23** | Medium* |
| T4.2 — Service role key exposure | 10 | 1 | 1 | 10 | 2 | **24** | Medium* |
| T4.3 — Service key leak (past) | 10 | 10 | 10 | 10 | 8 | **48** | **Critical** |
| T4.4 — XSS search | 6 | 3 | 4 | 7 | 5 | **25** | Medium |
| T4.5 — XSS game details | 6 | 3 | 3 | 7 | 5 | **24** | Medium |
| T4.6 — Debug logging | 3 | 5 | 3 | 3 | 8 | **22** | Low |
| T5.1 — CheapShark rate-limit | 2 | 3 | 2 | 8 | 3 | **18** | Low |
| T5.2 — DB DoS | 7 | 2 | 2 | 8 | 3 | **22** | Medium |
| T5.3 — Typesense flood | 4 | 5 | 3 | 6 | 3 | **21** | Medium |
| T5.4 — Cron DoS | 5 | 3 | 2 | 5 | 3 | **18** | Medium |
| T6.1 — Service role privilege | 10 | 1 | 1 | 10 | 3 | **25** | High |
| T6.2 — CRON_SECRET compromise | 8 | 2 | 3 | 8 | 5 | **26** | High |
| T6.3 — Role escalation | 7 | 1 | 1 | 5 | 2 | **16** | Low |
| T6.4 — Cross-user data access | 7 | 4 | 4 | 7 | 4 | **26** | Medium |

\* *T1.3 and T4.1/T4.2 DREAD scores are elevated by high discoverability (client code is visible) but severity is mitigated by server-side enforcement and env var scoping, respectively.*

### Risk Classification

| Total DREAD | Classification | Action |
|-------------|----------------|--------|
| 40+ | **Critical** | Fix immediately |
| 25–39 | **High** | Fix in current sprint |
| 20–24 | **Medium** | Schedule within 2 sprints |
| < 20 | **Low** | Accept or backlog |

---

## 4. Trust Boundary Details

### TB1 — Browser ↔ Next.js (Network)

**Boundary:** Public internet, HTTPS.

| Risk | Mechanism | Status |
|------|-----------|--------|
| Session hijacking | Supabase SSR cookie with HttpOnly, Secure, SameSite=Lax | ✅ Implemented |
| CSRF | Next.js Server Actions have built-in CSRF protection (requires `__next` action ID header check) | ✅ Implemented |
| XSS | React DOM auto-escaping; no `dangerouslySetInnerHTML` | ✅ Implemented |
| Open redirect | Allowlist-based URL validation in `/out` route | ✅ Implemented |
| Rate limiting | Not implemented — relies on Vercel Edge Network | ❌ Not implemented |

### TB2 — Next.js ↔ Supabase/Postgres

**Boundary:** TLS-encrypted database connection.

| Risk | Mechanism | Status |
|------|-----------|--------|
| SQL injection | Drizzle ORM parameterized queries (`sql` tagged templates) | ✅ Implemented |
| Auth bypass | `getUser()` server-side verification on every request | ✅ Implemented |
| RLS bypass | Service role key can bypass RLS — used only in controlled server paths | ⚠️ Partial (critical risk if compromised) |
| Connection leak | Singleton `db` client using `postgres` pool | ✅ Implemented |

### TB3 — Vercel Cron ↔ Next.js API

**Boundary:** Vercel internal network (production). Public network in dev.

| Risk | Mechanism | Status |
|------|-----------|--------|
| Unauthorized trigger | `Authorization: Bearer <CRON_SECRET>` header validation | ✅ Implemented |
| Network restriction | Vercel Cron built-in source IP restriction (production only) | ⚠️ Production only |
| Timing-safe comparison | Uses standard `!==` (not `crypto.timingSafeEqual`) | ⚠️ Low risk for random secret |

### TB4 — Next.js ↔ Typesense

**Boundary:** TLS (configurable via `TYPESENSE_PROTOCOL`).

| Risk | Mechanism | Status |
|------|-----------|--------|
| Admin key leakage | Server-only env var (`TYPESENSE_ADMIN_KEY`), no `NEXT_PUBLIC_` prefix | ✅ Implemented |
| Search key abuse | `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` is read-only, search-only | ✅ Implemented |
| Unauthorized indexing | Admin key required for write operations | ✅ Implemented |

### TB5 — Next.js ↔ CheapShark API

**Boundary:** Public API over HTTPS.

| Risk | Mechanism | Status |
|------|-----------|--------|
| Malicious API response | Data validated before DB insert (type coercion, fallback defaults) | ✅ Partial |
| Supply chain | CheapShark is external, untrusted — treat all data as untrusted | ⚠️ Accepted risk |

---

## 5. Past Incidents

### Incident 1: Service Role Key Leak in Git History

**Date:** 2026-06-12/13 (PR #10 session learnings)  
**Summary:** The Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) was accidentally committed to the git repository. GitGuardian alert triggered detection.

**Impact:** Anyone with access to the repository history could use the service role key to:
- Bypass all Row-Level Security policies
- Read, write, and delete any table in the database
- Access user auth data via Supabase Admin API

**Resolution:**
1. Key rotated in Supabase project settings
2. Old key confirmed still active via `curl` verification — urgency for rotation confirmed
3. `.env.example` updated to use placeholder values only (no real secrets)

**Lessons Learned:**
- Service role keys remain active after exposure until manually rotated
- GitGuardian alerts should trigger immediate rotation PLUS verification
- `.env.example` must never contain real secrets (only placeholders)

**Current Status:** ✅ Resolved. Old key should be verified inactive.

### Incident 2: `.env.example` Variable Mismatch

**Date:** 2026-06-12/13  
**Summary:** `PUBLISHABLE_KEY` vs `ANON_KEY` naming mismatch between `.env.example` and actual code references caused silent CI build failure.

**Impact:** Build pipeline failed until env var names were reconciled.

**Resolution:** `.env.example` key names aligned with code expectations.

**Lessons Learned:**
- `.env.example` is part of the codebase and must be kept in sync with actual usage
- CI build failure was the detection mechanism (no pre-commit validation for env vars)

**Current Status:** ✅ Resolved.

---

## 6. Review Cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Threat model review | Quarterly | Security lead |
| Dependency audit (`pnpm audit`) | Weekly (CI) | Automated |
| Fallow security audit | Per push (pre-push hook) | Automated |
| GitGuardian / secret scanning | Per push (CI) | Automated |
| RLS policy review | Quarterly | Database admin |
| Environment variable audit | Quarterly | DevOps |
| Key rotation (Supabase service role) | Every 6 months or on exposure | DevOps |
| Penetration test | Annual | External team |

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-13 | Initial threat model | Security team |
