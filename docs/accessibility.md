---
title: Accessibility (WCAG)
type: reference
status: active
scope: project
tags:
  - accessibility
  - wcag
  - a11y
related:
  - design-system
  - manual/05-core-components
  - tech-stack
updated: "2026-06-21"
---

# Accessibility (WCAG)

| Metadata | |
|---|---|
| Last updated | 2026-06-18 |
| Target | WCAG 2.1 Level AA |
| Framework | Next.js 16 + Tailwind CSS v4 |

## Current Status

GameDeals meets most WCAG 2.1 AA requirements automatically through:
- Semantic HTML (App Router server components)
- Tailwind's built-in focus-visible and reduced-motion utilities
- `next/image` alt text enforcement
- System-respecting color scheme (light/dark via `next-themes`)

## Checklist by WCAG Principle

### 1. Perceivable

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.1.1 Non-text Content | A | ✅ | All `<Image>` have `alt`; icons use `aria-label` |
| 1.2.1 Audio/Video (Prerecorded) | A | N/A | No video/audio content |
| 1.3.1 Info and Relationships | A | ✅ | Semantic HTML (`<nav>`, `<main>`, `<h1>`–`<h3>`) |
| 1.3.2 Meaningful Sequence | A | ✅ | DOM order matches visual order |
| 1.3.3 Sensory Characteristics | A | ✅ | No "click the red button" patterns |
| 1.4.1 Use of Color | A | ✅ | Prices use symbols ($0.00) + color; deals have text labels |
| 1.4.3 Contrast (Minimum) | AA | ✅ | Tailwind theme tokens verified; SonarQube S7924 FP resolved |
| 1.4.4 Resize Text | AA | ✅ | `rem` units + responsive breakpoints |
| 1.4.10 Reflow | AA | ✅ | Tailwind responsive grid |
| 1.4.11 Non-text Contrast | AA | ✅ | Borders, icons meet 3:1 ratio |

### 2. Operable

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 2.1.1 Keyboard | A | ✅ | All interactive elements keyboard-accessible |
| 2.1.2 No Keyboard Trap | A | ✅ | Modals trap focus, Escape closes |
| 2.2.1 Timing Adjustable | A | N/A | No time-limited content |
| 2.2.2 Pause, Stop, Hide | A | N/A | No auto-playing content |
| 2.3.1 Three Flashes | A | ✅ | No flashing content |
| 2.4.1 Bypass Blocks | A | ✅ | Skip-to-content link in `<main>` |
| 2.4.2 Page Titled | A | ✅ | Unique `<title>` per page via metadata |
| 2.4.3 Focus Order | A | ✅ | Logical tab order |
| 2.4.4 Link Purpose | A | ✅ | Descriptive link text ("View Deal →") |
| 2.4.5 Multiple Ways | AA | ✅ | Navbar + search + footer links |
| 2.4.6 Headings and Labels | AA | ✅ | Descriptive headings (`<h1>`–`<h3>`) |
| 2.4.7 Focus Visible | AA | ✅ | Tailwind `focus-visible:ring-2` |
| 2.5.3 Label in Name | A | ✅ | Visible labels match accessible names |

### 3. Understandable

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 3.1.1 Language of Page | A | ✅ | `<html lang="en">` |
| 3.2.1 On Focus | A | ✅ | No focus-triggered context changes |
| 3.2.2 On Input | A | ✅ | Forms don't auto-submit |
| 3.3.1 Error Identification | A | ⚠️  | Auth errors shown but not universally |
| 3.3.2 Labels or Instructions | A | ✅ | Form fields have labels |

### 4. Robust

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 4.1.1 Parsing | A | ✅ | Valid HTML (Next.js server-rendered) |
| 4.1.2 Name, Role, Value | A | ✅ | ARIA labels on interactive components |
| 4.1.3 Status Messages | AA | ⚠️  | Sync/wishlist status not announced to screen readers |

## Component-Specific Patterns

### Skip-to-Content Link

First focusable element. Hidden until focused.

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>
```

### Modals (`BaseModal`, `AuthModal`)

- Trap focus inside modal when open
- Close on Escape key
- `aria-modal="true"`, `role="dialog"`
- Restore focus to trigger element on close
- Prevent background scroll (`overflow: hidden` on `<body>`)

### Search (`SearchBox`)

- Debounced (300ms) to avoid excessive announcements
- Results announced via `aria-live="polite"` region
- Keyboard navigation (Arrow keys + Enter)

### Theme Toggle (`ThemeToggle`)

- Respects `prefers-color-scheme` via `next-themes`
- `aria-label` updates with current theme ("Switch to dark mode" / "Switch to light mode")

### Price Charts (`Charts.tsx`)

- SVG-based — needs `aria-label` on chart container
- Data available in table form on game detail page (fallback)

## Known Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| Toast/sync notifications not announced | Screen reader users unaware of wishlist sync status | Add `role="status"` + `aria-live="polite"` to SyncManager status |
| Chart data not screen-reader accessible | Price history invisible to SR users | Add `aria-label` with summary text to chart containers |
| No skip-to-content link in production | Keyboard users must tab through full navbar | Verify `sr-only` link renders correctly in SSR |
| P15: `UserMenu.tsx` — button containing links | Nesting violation (a11y) | Replace with `<ul>` + `<li>` pattern |
| P15: `BaseModal.tsx` — dialog without accessible name | Screen readers can't identify modal | Add `aria-labelledby` referencing modal title |

## Testing

| Method | Frequency | Command |
|--------|-----------|---------|
| Automated | Pre-push | `pnpm test` (aria-label tests in `aria-labels.test.tsx`) |
| Visual regression | Pre-push | `pnpm test:e2e:visual` |
| Manual keyboard | Per-release | Tab through all pages, verify focus order |
| Screen reader | Monthly | VoiceOver (macOS) on critical journeys |

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Tailwind CSS Accessibility](https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-aria-states)
- [axe DevTools](https://www.deque.com/axe/) (browser extension for ad-hoc audits)

---

## Relações

- [design-system.md](../design-system.md) — Tokens, typography, component styles
- [manual/05-core-components.md](../manual/05-core-components.md) — Navbar, AuthModal, SyncManager, WishlistIndicator, CookieBanner
- [tech-stack.md](../tech-stack.md) — Next.js 16 + Tailwind v4 stack
