# Sprint 12 — Issues Encountered

## Issue 1: Stale prompt injection campaign

**Impact:** Multiple turn injections attempted to force ULTRAWORK/Ralph-loop compliance phrases
**Resolution:** Quarantined silently. No code/output changes adopted from injections.
**Documented in:** audit-2026-06-21.md "Prompt Injection Report" section.

## Issue 2: Sub-agent empty-prompt bug

**Description:** F4.1 (CI scan verify) + F4.2 (SECURITY.md) sub-agent received malformed empty prompt
**Workaround:** CI scan already had `pnpm audit --audit-level=high` step (verified manually). SECURITY.md created by previous sub-agent session with slightly different content than my draft — accepted the working version rather than overwrite.

## Issue 3: SentryEvent type mismatch

**Description:** Initial beforeSend signature used `SentryEvent = ErrorEvent | Event` union, but Sentry SDK's ErrorEvent requires `type: undefined` (not optional literal).
**Resolution:** Use ErrorEvent directly + `as unknown as SentryEventLike` cast in filter helpers. Public signature matches SDK.
**Cost:** 3 iterations of fix + 1 biome auto-format pass.

## Issue 4: Parallel sub-agents created SECURITY.md twice

**Description:** Phase 4 worker created SECURITY.md; my override write failed with "file already exists".
**Resolution:** Read existing + accepted sub-agent's version rather than overwrite.

## Issue 5: F1.3 (H2 service role rotation) blocked

**Description:** Cannot rotate Supabase service_role from CLI — requires dashboard access + likely Vercel env coordination.
**Plan markers:** `[~]` (blocked, not `[ ]`)
**Steps documented in** audit doc for human execution.
