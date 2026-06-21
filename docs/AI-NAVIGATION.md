---
title: AI Navigation Protocol — GameDeals Documentation
type: protocol
status: active
scope: project
tags:
  - ai-navigation
  - protocol
  - memory
related:
  - index
  - tech-stack
  - database-schema
  - accessibility
  - test-strategy
  - runbook
updated: "2026-06-21"
---

# AI Navigation Protocol — GameDeals Documentation

**This document teaches AI agents how to efficiently navigate GameDeals documentation before implementing changes.**

## Navigation Rules

### 1. ALWAYS Start Here
Read `docs/index.md` first. It contains priority labels:
- `[MUST READ]` — Essential context for ANY task
- `[REFERENCE]` — Read on demand for specific domains
- `[ARCHIVE]` — Historical only, skip unless debugging history

### 2. Route by Task Domain

| Task Domain | Read First | Then If Needed |
|-------------|------------|----------------|
| **Any implementation** | `tech-stack.md` (canonical stack) | — |
| **Database / Schema** | `database-schema.md` | `adr/ADR-009-price-history-storage.md` |
| **Auth / Supabase** | `adr/ADR-004-auth-backend.md` | `supabase_setup_guide.md` |
| **Frontend / UI** | `design-system.md` + `accessibility.md` | `manual/05-core-components.md` |
| **API / Server Actions** | `api-reference.md` | `manual/02-api-and-services.md` |
| **Search / Typesense** | `adr/ADR-010-search-architecture.md` | `api-reference.md#search` |
| **Testing** | `test-strategy.md` | `TDD_WORKFLOW.md` |
| **Cron / Operations** | `runbook.md` | `api-reference.md#cron` |
| **Deployment** | `vercel_deployment_guide.md` | `adr/ADR-005-deployment-strategy.md` |
| **Architecture decisions** | `adr/README.md` | Specific ADR |
| **State management** | `adr/ADR-003-state-management.md` | `manual/03-gamification-and-state.md` |
| **Security** | `security/threat-model.md` | `monitoring.md` |

### 3. Follow Related Links
After reading a doc, check its `## Relações` section. Read those files if relevant to your task.

### 4. Skip Stale Content
Any doc with `status: superseded` or `status: deprecated` in frontmatter — skip unless explicitly asked to review history.

### 5. Don't Invent Context
If information isn't documented:
- Don't assume it's a decision
- Flag as open question
- Ask the human for clarification

### 6. Update After Decisions
When a new decision is made:
- Update the relevant doc
- Update `related` if new connections created
- Update `updated` date

---

## Document Map (Active Only)

```
docs/
├── index.md                    ← START HERE
├── AI-NAVIGATION.md            ← THIS FILE
├── tech-stack.md               ← Canonical stack
├── database-schema.md          ← DB schema + ERD
├── design-system.md            ← Tokens, typography, components
├── accessibility.md            ← WCAG checklist + patterns
├── test-strategy.md            ← Testing approach + roadmap
├── runbook.md                  ← Operational playbooks
├── api-reference.md            ← Cron endpoints, server actions
├── vercel_deployment_guide.md  ← Deploy + cron setup
├── security/threat-model.md    ← STRIDE analysis
├── release-process.md          ← Release checklist
├── onboarding.md               ← New dev setup
├── monitoring.md               ← Sentry, Vercel Analytics
├── seo.md                      ← Metadata, structured data
├── technical-debt.md           ← Known debt register
├── prd.md                      ← Product requirements (partially stale)
│
├── adr/                        ← Architecture decisions (12)
│   ├── README.md               ← Index with status
│   ├── ADR-001-tech-stack.md
│   └── ...
│
├── manual/                     ← Human-readable walkthrough
│   ├── 01-architecture-and-decisions.md
│   └── ...
│
├── reports/                    ← Recent session reports
│   ├── sprint11-accessibility-and-quality.md
│   └── prd-evolution-report.md
│
├── archive/                    ← Historical (status: superseded)
│   ├── pr10-session-report.md
│   ├── pr12-session-report.md
│   └── ...
│
└── templates/                  ← Reusable templates
```

---

## Token Budget Estimates

| Document | ~Tokens | Priority |
|----------|---------|----------|
| `tech-stack.md` | 300 | MUST READ |
| `database-schema.md` | 500 | REFERENCE |
| `design-system.md` | 400 | REFERENCE |
| `accessibility.md` | 600 | REFERENCE |
| `test-strategy.md` | 800 | REFERENCE |
| `runbook.md` | 2000 | REFERENCE |
| `adr/ADR-*.md` | 200 each | ON DEMAND |
| `manual/*.md` | 200-300 each | LOW |

**Total active docs: ~6K tokens** — fits comfortably in context window.