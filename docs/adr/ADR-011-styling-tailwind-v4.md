# ADR-011: Styling Architecture — Tailwind CSS v4 (CSS-first) + Design Tokens

**Status**: Accepted
**Date**: 2026-06-10
**Author**: EmiyaKiritsugu3

---

## Context

GameDeals has its own design system: **glassmorphism, OLED/dark, glow gradients, custom animations**. Originally with CSS Modules. We need:

- **Performance**: Minimal CSS bundle, zero runtime, build-time compilation
- **Consistency**: Centralized design tokens (colors, spacing, typography, effects)
- **Productivity**: Utilities for layout, spacing, typography — without writing CSS boilerplate
- **Preservation**: Existing tokens (glow, glass blur, OLED background) must continue working
- **Future-proof**: CSS native features (layers, nesting, container queries, OKLCH, color-mix)

---

## Decision

**Tailwind CSS v4** (CSS-first configuration) in **hybrid** mode — uses `@theme` for design tokens + utilities for layout/spacing/typography.

### Architecture

```css
/* src/app/globals.css */
@import "tailwindcss";

/* ─── Design Tokens do GameDeals ─── */
@theme {
  /* OLED / Dark Foundation */
  --color-oled-black: #0a0a0f;
  --color-surface-dark: #0d0d1a;
  --color-surface-card: rgba(15, 15, 25, 0.85);

  /* Glassmorphism */
  --color-glass-bg: rgba(15, 15, 25, 0.72);
  --color-glass-border: rgba(255, 255, 255, 0.08);
  --blur-glass: 24px;

  /* Glow Effects */
  --glow-primary: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15), transparent 60%);
  --glow-accent: radial-gradient(ellipse at 100% 100%, rgba(236, 72, 153, 0.1), transparent 50%);
  --glow-purple: 0 0 20px rgba(139, 92, 246, 0.3);
  --glow-cyan: 0 0 20px rgba(34, 211, 238, 0.2);

  /* Accent Colors */
  --color-accent-primary: #8b5cf6;
  --color-accent-secondary: #ec4899;
  --color-accent-cta: #22d3ee;

  /* Semantic Colors */
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-error: #ef4444;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing Scale (opcional — usa Tailwind default) */
  --spacing-safe: 1.5rem;

  /* Animation Curves */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);

  /* Border Radius */
  --radius-glass: 12px;
  --radius-card: 8px;
}

/* ─── Glassmorphism Utility ─── */
@utility glass {
  background: var(--color-glass-bg);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-glass);
}

/* ─── Glow Utilities ─── */
@utility glow-primary {
  background: var(--glow-primary);
}
@utility glow-accent {
  background: var(--glow-accent);
}
```

### Usage in Components

```tsx
// Hero Section - Antes (CSS Modules)
<div className={styles.hero}>
  <h1 className={styles.title}>Game Deals</h1>
</div>

/* styles.module.css
.hero {
  background: var(--glow-primary), var(--glow-accent), var(--oled-black);
}
.title { font-size: 3rem; }
*/

// Hero Section - Depois (Tailwind v4)
<div className="bg-[var(--glow-primary)] bg-[var(--glow-accent)] bg-oled-black pt-safe">
  <h1 className="text-5xl font-bold tracking-tight">Game Deals</h1>
</div>
```

### Framer Motion + Tailwind

```tsx
// Animations continue with Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  className="glass p-6 space-y-4"
>
```

### Global Tokens — Preserved

```css
/* GLOBAL ANIMATIONS - kept in globals.css below @import */
@keyframes fade-in { /* ... */ }
@keyframes slide-up { /* ... */ }
@keyframes shimmer { /* ... */ }
```

---

## Consequences

### Positive
- **Productivity**: 80% of CSS becomes inline utilities (flex, grid, spacing, text size)
- **Consistency**: Design tokens centralized in one place (`@theme`)
- **Performance**: Pure CSS, zero runtime, build-time compilation, automatic tree-shaking
- **Gradual migration**: Can coexist with CSS Modules during transition
- **Community**: Tailwind is the 2026 standard, official plugins, native VS Code extension
- **OKLCH**: Native support for perceptual color space (more vibrant colors)
- **Tailwind v4 CSS-first**: `@import "tailwindcss"` without JS config — aligned with modern standards

### Negative / Trade-offs
- **Verbose JSX**: 10+ inline classes can pollute template (mitigated: `@apply` in `@utility` for repeated patterns)
- **Existing CSS Modules**: Manual component conversion (mitigated: gradual, component by component)
- **Learning curve**: Utility names (mitigated: VS Code autocomplete + IntelliSense)
- **Build time**: Tailwind v4 is 3.78x faster than v3, but still adds ~200ms to build

### Migration Roadmap

| Phase | Components | Effort |
|------|------------|---------|
| 1 | Layout (page.tsx, layout.tsx, globals.css → @import) | 30 min |
| 2 | UI primitives (Sidebar modal, Glass wrapper, Buttons) | 1h |
| 3 | Complex (Navbar search, Hero, Historical Lows, Deal cards) | 2h |
| 4 | User facing (Wishlist, Profile, Playlists, Badges) | 1h |
| 5 | Cleanup (remove .module.css files) | 15 min |

---

## References
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first, OKLCH, 3.78x faster
- [Tailwind CSS v4.3 Release](https://tailwindcss.com/blog/tailwindcss-v4-3) — Custom scrollbars, webpack plugin
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/installation) — `@import`, `@theme`, `@utility`, `@variant`
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Full technology stack
- [ADR-003: State Management](ADR-003-state-management.md) — Server Components + Client Components pattern
- `src/app/globals.css` — Design tokens + @import tailwindcss
- `src/app/layout.tsx` — Root layout with Tailwind classes