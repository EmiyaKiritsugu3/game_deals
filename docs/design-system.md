# Design System

| Metadata | |
|---|---|
| Last updated | 2026-07-02 |
| Framework | Tailwind CSS v4 |
| Theme | next-themes (dark/light/system) |
| Color space | OKLCH |
| Register | Product (app UI) |

**Canonical spec:** [DESIGN.md](../DESIGN.md) at project root.

## Color Tokens

All colors use CSS custom properties via `oklch()` for perceptually-uniform interpolation.
Defined in `:root` (light) and `.dark` blocks in `src/app/globals.css`.

### Brand

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | `oklch(0.62 0.19 150)` Forge Emerald | `oklch(0.78 0.2 145)` | CTAs, links, active states, brand |
| `--primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.16 0.05 150)` | Text on primary bg |
| `--hot` | `oklch(0.7 0.17 60)` Deal Amber | `oklch(0.78 0.16 70)` | Discounts, urgency signals, badges |
| `--hot-foreground` | `oklch(0.99 0 0)` | `oklch(0.16 0.05 70)` | Text on hot bg |
| `--accent-hl` | `oklch(0.62 0.19 150)` | `oklch(0.78 0.2 145)` | Historic-low badges |
| `--accent-hl-foreground` | `oklch(0.99 0 0)` | `oklch(0.16 0.05 150)` | Text on HL bg |

### Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `oklch(0.985 0.002 240)` | `oklch(0.13 0.004 240)` | Page background |
| `--foreground` | `oklch(0.16 0.01 240)` | `oklch(0.97 0.005 240)` | Body text |
| `--card` | `oklch(1 0 0)` | `oklch(0.165 0.005 240)` | Cards, modals, sidebars |
| `--card-foreground` | `oklch(0.16 0.01 240)` | `oklch(0.97 0.005 240)` | Text inside cards |
| `--muted` | `oklch(0.96 0.004 240)` | `oklch(0.2 0.005 240)` | Subtle backgrounds, hover |
| `--muted-foreground` | `oklch(0.5 0.01 240)` | `oklch(0.68 0.01 240)` | Secondary text, captions |

### Glass Elevation System

4-tier glass system defined via Tailwind classes (not custom properties):

| Class | Usage |
|-------|-------|
| `glass` | Base cards (`bg-card/40 backdrop-blur-md border border-border/50`) |
| `glass-panel` | Side panels, dropdowns (thicker bg + blur) |
| `glass-modal` | Dialogs, overlays (heaviest glass) |
| `glass-nav` | Navigation bars (subtlest, fits nav context) |

## Typography

| Family | Role | CSS variable |
|--------|------|-------------|
| Space Grotesk | Display (headings, hero) | `--font-display` |
| Geist | Body (all text, UI labels) | `--font-sans` |
| Geist Mono | Code, prices, tabular data | `--font-mono` |

**One Family Rule:** Only Space Grotesk + Geist. No Inter, no JetBrains Mono.

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem | Badges, captions |
| `text-sm` | 0.875rem | Secondary text, labels |
| `text-base` | 1rem | Body text |
| `text-lg` | 1.125rem | Card titles |
| `text-xl` | 1.25rem | Section headers |
| `text-2xl` | 1.5rem | Page titles (h1) |
| `text-4xl` | 2.25rem | Hero headings |

**Weights**: `font-normal` (400) body, `font-medium` (500) labels/buttons,
`font-semibold` (600) card titles, `font-bold` (700) headings/prices,
`font-extrabold` (800) hero/discounts.

## Spacing

Based on Tailwind's 4px grid (`1 = 0.25rem`):

| Scale | Value | Usage |
|-------|-------|-------|
| `p-2 / gap-2` | 0.5rem | Compact (badges, icons) |
| `p-4 / gap-4` | 1rem | Cards, lists |
| `p-6 / gap-6` | 1.5rem | Sections, modals |
| `p-8` | 2rem | Page sections, hero |

Container: `max-width: 1280px` (`max-w-7xl`), centered `mx-auto`, pad `px-4 sm:px-6 lg:px-8`.

## Motion

Animations defined as `--animate-*` tokens in `@theme` block. No JS animation libraries.

| Pattern | Class |
|---------|-------|
| Hover scale | `hover:scale-105 transition-transform` |
| Hover color | `hover:bg-accent/30 transition-colors` |
| Sheen sweep | `sheen` class (gradient overlay on CTAs) |
| Heartbeat | `animate-heartbeat` (wishlist icon) |
| Fade in | `animate-fade-in` |
| Slide in | `animate-fade-slide-in` |
| Pulse soft | `animate-pulse-soft` (loading states) |
| Reduced motion | `motion-reduce:transition-none motion-reduce:animate-none` |

## Design Rules

- **One Voice Rule:** Only Forge Emerald + Deal Amber. No fuchsia, purple, cyan, rose.
- **Dark Canvas Rule:** Dark-first design. Light mode is clean, dark mode is deep/near-black.
- **One Family Rule:** Space Grotesk (display) + Geist (body) only.
- **Flat-By-Default Rule:** No gradient text, no glassmorphism unless purposeful.
- **Every pixel earns its place:** No decorative borders, no side-stripe accents.

## File Conventions

- **Global styles**: `src/app/globals.css` (Tailwind directives + `@theme` block + keyframes)
- **CSS `@keyframes`**: Defined in `globals.css` `@theme` as `--animate-*` tokens
- **No CSS modules**: All styling is Tailwind utilities + CSS custom properties
- **No `.module.css` files**: Enforced by CLAUDE.md

## Tools

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) (CSS animation utilities)
