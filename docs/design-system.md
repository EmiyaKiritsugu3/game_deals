# Design System

| Metadata | |
|---|---|
| Last updated | 2026-06-18 |
| Framework | Tailwind CSS v4 |
| Theme | next-themes (dark/light/system) |

## Color Tokens

All colors use CSS custom properties via Tailwind's `hsl(var(--*))` pattern for automatic dark/light switching.

### Primary

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | Green-600 `#16a34a` | Green-400 `#4ade80` | CTAs, links, active states, brand |
| `--primary-foreground` | White `#fff` | Black `#000` | Text on primary bg |

### Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | White | Gray-950 | Page background |
| `--foreground` | Gray-900 | Gray-50 | Body text |
| `--card` | Gray-50 | Gray-900 | Cards, modals, sidebars |
| `--card-foreground` | Gray-900 | Gray-50 | Text inside cards |
| `--muted` | Gray-100 | Gray-800 | Subtle backgrounds, hover |
| `--muted-foreground` | Gray-500 | Gray-400 | Secondary text, captions |

### Borders and Feedback

| Token | Value | Usage |
|-------|-------|-------|
| `--border` | Gray-200 / Gray-700 | Card borders, dividers |
| `--ring` | Green-500 | Focus rings |
| `--radius` | `0.5rem` (8px) | Border radius (cards, buttons, inputs) |
| `--destructive` | Red-500 `#ef4444` | Delete buttons, errors |

## Typography

```css
--font-inter: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem | Badges, captions |
| `text-sm` | 0.875rem | Secondary text, labels |
| `text-base` | 1rem | Body text |
| `text-lg` | 1.125rem | Card titles |
| `text-xl` | 1.25rem | Section headers |
| `text-2xl` | 1.5rem | Page titles (h1) |
| `text-4xl` | 2.25rem | Hero headings |

**Weights**: `font-normal` (400) body, `font-medium` (500) labels/buttons, `font-semibold` (600) card titles, `font-bold` (700) headings/prices, `font-extrabold` (800) hero/discounts.

## Spacing

Based on Tailwind's 4px grid (`1 = 0.25rem`):

| Scale | Value | Usage |
|-------|-------|-------|
| `p-2 / gap-2` | 0.5rem | Compact (badges, icons) |
| `p-4 / gap-4` | 1rem | Cards, lists |
| `p-6 / gap-6` | 1.5rem | Sections, modals |
| `p-8` | 2rem | Page sections, hero |

Container: `max-w-7xl` (1280px), centered `mx-auto`, pad `px-6`.

## Component Patterns

### Buttons

```
Primary:   bg-primary text-primary-foreground rounded-[var(--radius)] px-4 py-2
Secondary: border bg-card hover:bg-muted rounded-[var(--radius)] px-4 py-2
Danger:    bg-destructive text-white rounded-[var(--radius)] px-4 py-2
Ghost:     hover:bg-muted rounded-[var(--radius)] p-2
```

All buttons: `font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring`.

### Cards (GameCard)

```
group relative overflow-hidden rounded-[var(--radius)] border bg-card
  → Image (16:9, object-cover)
  → p-4: title, price tag, badge
  → hover:shadow-lg transition-shadow
```

### Modals (BaseModal)

```
fixed inset-0 z-50 flex items-center justify-center
  → Overlay: fixed inset-0 bg-black/50 backdrop-blur-sm
  → Content: z-10 max-w-md rounded-[var(--radius)] border bg-card p-6 shadow-xl
```

`role="dialog" aria-modal="true"`. Close on Escape. Trap focus.

### Price Tags

```
Sale:     text-xl font-bold text-primary
Original: text-sm text-muted-foreground line-through
Savings:  rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-bold text-green-600
FREE:     rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-bold text-amber-600
```

### Navbar

```
sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md
  → max-w-7xl mx-auto flex h-16 items-center justify-between px-6
    → Logo, SearchBox, NavActions (auth, theme, wishlist)
```

## Motion

| Pattern | Class |
|---------|-------|
| Hover scale | `hover:scale-105 transition-transform` |
| Hover color | `hover:bg-muted transition-colors` |
| Fade in | `animate-in fade-in duration-300` |
| Slide up | `animate-in slide-in-from-bottom-4 duration-300` |
| Reduced motion | `motion-reduce:transition-none motion-reduce:animate-none` |

## Dark Mode

Enabled via `next-themes` `ThemeProvider` with `attribute="class"`. Dark variants use Tailwind's `dark:` prefix:

```html
<html class="dark">
  <body class="bg-background text-foreground">
    <!-- dark: variants activate -->
  </body>
</html>
```

Theme toggle: `ThemeToggle.tsx` with `useTheme()` hook, `aria-label` updates dynamically.

## File Conventions

- **CSS Modules**: `ComponentName.module.css` (co-located with component)
- **Global styles**: `src/app/globals.css` (Tailwind directives + CSS custom properties)
- **Custom CSS**: Only for complex layouts not expressible in Tailwind (charts, gradients)

## Tools

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [tailwindcss-animate](https://tailwindcss-animate.com) (animation utilities)
