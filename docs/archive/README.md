# Archived Documentation

This directory contains obsolete documentation files that were moved here from `docs/` root during the June 2026 documentation overhaul.

## Why Archived

These files contained references to outdated technologies (Next.js 14, Vanilla CSS Modules, SWR) that **contradict the current architecture** (Next.js 16, Tailwind CSS v4, TanStack Query v5). They were preserved for historical reference but should **not** be used as guidance.

## Files Archived

| File | Original Location | Reason |
|------|-------------------|--------|
| `jules_master_onboarding.md` | `docs/` | Dangerous: said "NÃO USE TAILWIND" (Tailwind v4 is now primary styling) |
| `jules_technical_faq.md` | `docs/` | FAQ referencing outdated stack (CSS Modules, SWR) |
| `jules_deployment_handover.md` | `docs/` | Historical deployment notes (pre-dates current CI/CD) |
| `jules_evolution_plan.md` | `docs/` | Long-term vision with outdated technology references |
| `activity_feed_fix.md` | `docs/` | CSS Module layout fix guide (irrelevant with Tailwind v4) |
| `walkthrough.md` | `docs/` | Screenshot walkthrough with local file paths (broken links) |
| `task.md` | `docs/` | Historical task tracker for phases 1-19 (all completed) |
| `gamification_plan.md` | `docs/` | Pre-implementation plan (gamification is now fully implemented) |
| `project_architecture_analysis.md` | `docs/` | Architecture scorecard referencing Next.js 13+ |
| `project_status_report.md` | `docs/` | Status report from March 2026 (historical value only) |
| `database_migration_v2.sql` | `docs/` | Raw SQL migration (duplicates Drizzle ORM schema — use `drizzle/` migrations instead) |

## Replacement Documentation

| Category | Location |
|----------|----------|
| Master Documentation Hub | `docs/index.md` |
| Manual (rewritten chapters) | `docs/manual/` |
| Architecture Diagrams (C4) | `docs/architecture/` |
| Current Conventions | `AGENTS.md` (project root) |
| Operation Runbooks | `docs/runbook.md` |
| API Reference | `docs/api-reference.md` |

## Date Range

Archived files span: **March 2026 — June 2026**
