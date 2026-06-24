# Task 2: AlertCard extraction (Phase A2)

## Context
Spec document: `docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md`
Section: 2.A2 — AlertsPage complexity refactor

## Problem
`src/app/alerts/page.tsx` — 139 lines, CRAP score 49.5, cyclomatic complexity 13.
Extract inline JSX per-alert into reusable `AlertCard` component.

## Requirements

### New file
`src/components/alerts/AlertCard.tsx`

Props:
- `alert: AlertRow` (the alert data — infer type from page.tsx usage)
- `onDelete: (alertId: string) => void`

What it renders:
- Game name
- Store badge (store name/logo if available)
- Current price
- Target price
- Delete button (calls `onDelete(alert.id)`)

### Modified file
`src/app/alerts/page.tsx`

Replace inline JSX loop body with:
```tsx
<AlertCard key={a.id} alert={a} onDelete={handleDelete} />
```

`handleDelete` stays in page — it owns the TanStack Query mutation.

### Test
New file: `src/components/alerts/__tests__/AlertCard.test.tsx`
- Renders all fields (game name, prices, store badge)
- Delete button fires callback with correct alert ID

## Constraints
- Kebab-case file names
- Server Component by default — but since interactivity (delete button) needed, add `'use client'`
- No `any` type annotations without comment
- Follow existing patterns in `src/components/` (check similar cards)

## Verification
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test -- --run` (passes existing + new tests)
