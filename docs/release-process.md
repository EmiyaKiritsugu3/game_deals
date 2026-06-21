---
title: Release Process
type: process
status: active
scope: project
tags:
  - release
  - deployment
  - process
related:
  - adr/ADR-005-deployment-strategy
  - vercel_deployment_guide
  - runbook
updated: "2026-06-21"
---

# Release Process — GameDeals

> **Last updated:** 2026-06-21
> **Stack:** Next.js 16 + Supabase SSR + Drizzle ORM + CheapShark API + Typesense
> **Deployment:** Vercel (auto-deploy on main branch push)

---

## Table of Contents

1. [Pre-release Checklist](#1-pre-release-checklist)
2. [Release Workflow](#2-release-workflow)
3. [Build Verification](#3-build-verification)
4. [Deployment](#4-deployment)
5. [Post-deploy Verification](#5-post-deploy-verification)
6. [Rollback Procedures](#6-rollback-procedures)
7. [Emergency Hotfix](#7-emergency-hotfix)

---

## 1. Pre-release Checklist

Run these checks locally before opening a pull request. Every item must pass.

### 1.1 Full CI Pipeline

```bash
pnpm check
```

This runs 6 gates in sequence (stops on first failure):

| Step | Command | What it checks |
|------|---------|----------------|
| 1. Lint | `pnpm lint` | Biome code style & correctness |
| 2. Type check | `pnpm exec tsc --noEmit` | TypeScript compilation errors |
| 7. SonarCloud quality gate | `.github/workflows/ci.yml` | Static analysis via SonarCloud (Security, Reliability, Maintainability) |
| 3. Tests + Coverage | `pnpm test:coverage` | Vitest unit tests pass, coverage threshold met |
| 4. Build | `pnpm build` | Production build succeeds (requires `.env.local`) |
| 5. Dead code | `pnpm knip --no-exit-code` | Unused exports/dependencies (warning only) |
| 6. Security audit | `pnpm fallow:audit` | Secret leakage, dependency vulnerabilities |

> **Note:** If `.env.local` is missing, `check.sh` auto-copies `.env.example`. For accurate build verification, ensure `.env.local` contains valid credentials.

### 1.2 Environment Variables

Verify all required env vars are set in both local `.env.local` and Vercel production:

| Variable | Required For | Check |
|----------|-------------|-------|
| `DATABASE_URL` | DB connectivity | `psql "$DATABASE_URL" -c "SELECT 1;"` |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth client | Must match Supabase project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Auth client | Must match Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron jobs | Must match Supabase service role key |
| `CRON_SECRET` | Cron auth | Must match header sent by Vercel Cron |
| `TYPESENSE_ADMIN_KEY` | Search indexing | Server-side only (not in `.env.local` for dev) |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | Search queries | Client-safe search key |
| `NEXT_PUBLIC_TYPESENSE_URL` | Search host | Typesense server URL |

### 1.3 Database Migrations

If the release includes schema changes:

```bash
# Generate migration from Drizzle schema changes
pnpm db:generate

# Review the generated SQL in drizzle/<timestamp>.sql
# Apply to local dev database
pnpm db:migrate

# Verify migration applied cleanly
pnpm db:studio
```

- Migration SQL files must be committed alongside code changes.
- Never modify a migration file after it's been committed and pushed.
- If a migration needs correction, create a new migration.

### 1.4 Pre-commit Hooks

- Husky runs `lint-staged` on staged files (`biome check --write`).
- This catches formatting issues before they reach CI.
- Verify with: `pnpm exec lint-staged --dry-run`

---

## 2. Release Workflow

```
Feature branch → Pull Request → CI checks → Merge to main → Tag → Vercel auto-deploy
```

### 2.1 Branch Strategy

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production-ready | Production (Vercel) |
| `feat/*` | New features | Preview (Vercel) |
| `fix/*` | Bug fixes | Preview (Vercel) |
| `chore/*` | Maintenance, deps, CI | Preview (Vercel) |

### 2.2 Pull Request Process

1. Create feature branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/my-feature
   ```

2. Commit changes following Conventional Commits:
   ```
   feat: add price history chart to game detail page
   fix: correct redirect loop in middleware
   chore: update pnpm to 11.5.3
   ```

3. Push branch and open PR:
   ```bash
   git push origin feat/my-feature
   # Open PR via GitHub CLI or web UI
   gh pr create --title "feat: add price history chart" --body "## Summary..."
   ```

4. PR must include:
   - Clear description of changes
   - Screenshots for UI changes
   - Migration SQL if schema changed
   - Link to related issue (if applicable)

5. CI runs automatically on PR (see `.github/workflows/ci.yml`):
   - Lint → TypeScript check → Tests + Coverage → Build → Dead code analysis → SonarCloud quality gate
   - All steps must pass green.
   - Required secrets use `${{ secrets.X || 'placeholder' }}` pattern, so CI passes on forks.

6. Code review:
   - At least one approval required.
   - Review focuses on: correctness, test coverage, security (env vars, RLS), performance.
   - See `docs/runbook.md` for known failure patterns.

7. Merge to `main`:
   - Use **Squash & Merge** for feature branches (single commit).
   - Use **Rebase & Merge** for fix commits.
   - Delete the feature branch after merge.

### 2.3 Tagging

After merge to `main`, tag the release:

```bash
git checkout main
git pull origin main
git tag v0.1.0
git push origin v0.1.0
```

Tag format: `v<major>.<minor>.<patch>` (semver).

Tags trigger no automated process — they serve as historical markers for rollback targets.

---

## 3. Build Verification

Before marking a release as complete, verify the production build:

### 3.1 Local Build

```bash
pnpm build
```

Expected outcome:
- Exit code 0
- All routes compiled successfully
- No TypeScript or lint errors
- No dynamic imports that could cause runtime errors

Check the output:
```bash
ls -la .next/
# Verify key directories exist
ls .next/standalone/  # If outputStandalone is configured
```

### 3.2 Preview Deployment

Every PR gets an automatic Vercel Preview deployment:
- URL format: `https://game-deals-git-<branch>-<org>.vercel.app`
- Available in PR checks section on GitHub
- Use preview to verify:
  - Visual changes render correctly
  - Auth flow works (login, protected routes)
  - Search returns results
  - Price data loads
  - No console errors

---

## 4. Deployment

### 4.1 Production Deployment

Deployment is fully automated. No manual CLI commands needed.

**Trigger:** Push or merge to `main` branch.

**Pipeline:**
1. GitHub pushes to `main`
2. Vercel detects the push (via Git integration)
3. Vercel runs `pnpm build` with production env vars
4. If build succeeds → deployed to production
5. If build fails → Vercel marks deployment as failed, no downtime (previous deployment stays live)

### 4.2 Cron Jobs

After deployment, verify that cron jobs are registered in **GitHub Actions** (not Vercel):

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/ingest-prices` | Every 4 hours | Fetch CheapShark deals |
| `/api/cron/reindex-typesense` | Daily | Rebuild Typesense search index |
| `/api/cron/check-alerts` | Every hour | Check price alerts |

Cron jobs are defined in `.github/workflows/cron.yml`. The API endpoints still run on Vercel — GitHub Actions calls them via HTTP with `CRON_SECRET` auth. To trigger manually:

```bash
gh workflow run cron.yml
```

> **Note:** This migration from Vercel Cron (Hobby limit: 1 execution/day) to GitHub Actions was done in Sprint 15.

### 4.3 Vercel Environment Variables

If the release adds new env vars:
```bash
vercel env add NEW_VAR production
vercel --prod
```

---

## 5. Post-deploy Verification

Run these checks immediately after deployment (within 15 minutes).

### 5.1 Health Check

```bash
# Homepage loads with 200
curl -s -o /dev/null -w "%{http_code}" https://game-deals.vercel.app/
# Expected: 200

# Game detail page
curl -s -o /dev/null -w "%{http_code}" https://game-deals.vercel.app/game/1
# Expected: 200

# Search page
curl -s -o /dev/null -w "%{http_code}" "https://game-deals.vercel.app/search?q=zelda"
# Expected: 200

# 404 for unknown routes
curl -s -o /dev/null -w "%{http_code}" https://game-deals.vercel.app/nonexistent
# Expected: 404
```

### 5.2 Cron Endpoints

Trigger each cron endpoint manually to verify:

```bash
# Price ingestion
curl -s -X GET "https://game-deals.vercel.app/api/cron/ingest-prices" \
  -H "authorization: Bearer $CRON_SECRET"
# Expected: {"success":true,...}

# Typesense reindex
curl -s -X GET "https://game-deals.vercel.app/api/cron/reindex-typesense" \
  -H "authorization: Bearer $CRON_SECRET"
# Expected: {"success":true,"indexed":...}

# Alert check
curl -s -X GET "https://game-deals.vercel.app/api/cron/check-alerts" \
  -H "authorization: Bearer $CRON_SECRET"
# Expected: {"processed":...,"triggered":...}
```

If any returns 401: `CRON_SECRET` mismatch between env var and the request header.

### 5.3 Database Connectivity

```bash
# Quick DB check via psql
psql "$DATABASE_URL" -c "SELECT 1;"
# Expected: (1 row)

# Check recent deal data
psql "$DATABASE_URL" -c "SELECT COUNT(*), MAX(updated_at) FROM games;"

# Check recent price recordings
psql "$DATABASE_URL" -c "SELECT COUNT(*), MAX(recorded_at) FROM price_history;"
```

### 5.4 Search

```bash
# Typesense search (if configured)
curl -s "https://$TYPESENSE_HOST/collections/games/documents/search?q=zelda&query_by=title" \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_ADMIN_KEY" | jq '.found'
# Expected: number > 0 (games indexed)

# CheapShark fallback (always works)
curl -s "https://www.cheapshark.com/api/1.0/games?title=zelda&limit=3" | jq 'length'
# Expected: 3 (or fewer, but not 0)
```

### 5.5 Auth Flow

- Visit `https://game-deals.vercel.app/wishlist` → should redirect to home if not logged in
- Log in via the auth modal → should redirect to wishlist
- Verify session persists on page reload
- Log out → verify protected routes redirect

### 5.6 Monitoring

Check Vercel dashboard for:
- Deployment status: green (not yellow/red)
- Runtime logs: no 500 errors or uncaught exceptions
- Cron job executions: successful runs with expected response times

```bash
# Vercel CLI
vercel logs game-deals --since=5m
```

---

## 6. Rollback Procedures

If post-deploy verification reveals issues, roll back immediately.

### 6.1 Vercel Rollback

**Option A: Vercel Dashboard (fastest)**
1. Go to [Vercel Dashboard > Deployments](https://vercel.com/<team>/game-deals/deployments)
2. Find the last known-good deployment
3. Click **⋮** (menu) → **Promote to Production**

**Option B: Vercel CLI**
```bash
# List recent deployments
vercel list

# Rollback to a specific deployment
vercel rollback <deployment-id>

# Expected: "Success! Rolled back deployment <id> to <previous-id>"
```

**Option C: Git revert (permanent)**
```bash
# Revert the offending commit
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

> Rollback takes ~30 seconds on Vercel. The previous deployment is already cached and ready.

### 6.2 Database Migration Rollback

If the release applied a DB migration that needs to be undone:

```bash
# List migrations
ls -la drizzle/ | grep ".sql"

# Rollback the last migration (down)
# Drizzle Kit does not have a built-in rollback command.
# Generate a compensating migration:
pnpm db:generate  # After reverting schema changes in code
pnpm db:migrate   # Apply the reversal

# Manual SQL rollback (if migration is simple):
psql "$DATABASE_URL" -f drizzle/<migration-to-undo>.sql --set="ROLLBACK=true"

# Verify schema state:
psql "$DATABASE_URL" -c "\dt"  # List tables
psql "$DATABASE_URL" -c "\d <table_name>"  # Describe table
```

**Rules for DB rollback:**
- Never delete columns if they contain production data (set nullable or default instead).
- Never drop tables without verifying they're unused.
- Test the rollback SQL on a staging environment first.

### 6.3 Cache Invalidation

After rollback, invalidate CDN caches if stale data is served:

```bash
# Vercel Edge Cache: re-deploy triggers invalidation automatically
# No additional steps needed
```

For Typesense search index (if corrupted data was indexed):
```bash
# Trigger a fresh reindex
curl -s -X GET "https://game-deals.vercel.app/api/cron/reindex-typesense" \
  -H "authorization: Bearer $CRON_SECRET"
```

### 6.4 Rollback Decision Matrix

| Issue | Rollback Strategy | Impact |
|-------|-------------------|--------|
| Build failure on deploy | No action needed (previous deploy stays live) | None |
| Missing features / wrong content | Vercel rollback | ~30s downtime |
| Auth broken | Vercel rollback | Users logged out |
| DB schema mismatch | Vercel rollback + migration rollback | Potential data loss if migration added columns then rolled back |
| Search broken | Reindex Typesense or Vercel rollback | Search degraded during reindex |
| Security vulnerability | Git revert + Vercel rollback + key rotation | Immediate fix |

### 6.5 Post-rollback Verification

After rollback, re-run the [Post-deploy Verification](#5-post-deploy-verification) checks to confirm the app is healthy.

---

## 7. Emergency Hotfix

For critical issues that cannot wait for the full release cycle:

1. Create a `hotfix/*` branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-auth-fix
   ```

2. Apply the minimal fix, commit with `fix:` prefix.

3. Bypass normal review only if absolutely necessary (document the reason).

4. Merge directly to `main`:
   ```bash
   git checkout main
   git merge hotfix/critical-auth-fix
   git push origin main
   ```

5. Monitor deployment closely (within 5 minutes of push).

6. Create a follow-up PR with proper review to address any shortcuts taken.

---

## Appendix A: Quick Command Reference

```bash
# Full local CI
pnpm check

# Individual checks
pnpm lint
pnpm exec tsc --noEmit
pnpm test:coverage
pnpm build
pnpm knip
pnpm fallow:audit

# DB migrations
pnpm db:generate
pnpm db:migrate
pnpm db:studio

# Deployment
git push origin main          # Triggers Vercel auto-deploy

# Rollback
vercel list                   # Find deployment ID
vercel rollback <id>          # Rollback to previous deployment

# Post-deploy health
curl https://game-deals.vercel.app/

# Cron trigger
curl -X GET https://game-deals.vercel.app/api/cron/ingest-prices \
  -H "authorization: Bearer $CRON_SECRET"
```

## Appendix B: Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| CI Pipeline | `.github/workflows/ci.yml` | GitHub Actions automated checks |
| Operations Runbook | `docs/runbook.md` | Incident response playbooks |
| Deployment Guide | `docs/vercel_deployment_guide.md` | Initial Vercel setup |
| Architecture | `docs/architecture/` | System design and decisions |
