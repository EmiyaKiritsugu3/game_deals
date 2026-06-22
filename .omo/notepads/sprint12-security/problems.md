# Sprint 12 — Unresolved Issues

## U1: F2.4 caller migration (helper exists, callers don't use it yet)

**Status:** Out of scope for sprint automation. Documented as follow-up.
**Affected files:**
- src/actions/wishlist.ts
- src/actions/alerts.ts
- src/actions/notifications.ts
- src/actions/playlists.ts (H1 fix kept inline)
- src/actions/deals.ts (some calls)

**Migration steps:**
1. Replace `getAuthenticatedUserId()` calls with `requireUser()`
2. Replace throw `new Error('Unauthorized')` pattern with throw `new UnauthorizedError()`
3. Update tests to mock the new helper

**Estimated effort:** 2-3 hours

## U2: F1.3 — Service role key rotation (BLOCKED)

**Status:** `[~]` in plan. Requires Supabase dashboard + Vercel env coordination.
**Manual steps (documented in audit doc):**
1. Pre-rotation safety: confirm Sentry beforeSend filter is active (F2.2 ✅)
2. Supabase dashboard → Project Settings → API → roll service_role key
3. Update envs: Vercel production, Vercel preview, GitHub Actions secret, local .env.local
4. Verify GitGuardian scan shows no leaks

## U3: PRD drift — known since Sprint 9

**Reference:** Sprint 10 secsdrafts (already addressed in PR #36).
**Status:** Not security-sprint scope. Already addressed separately.
