# PRD: Dark Mode Toggle

## Objective

Ship complete dark mode for GameDeals. Infrastructure exists (`next-themes`, CSS token variables for `.dark`, `ThemeToggle` component in nav) but **25+ CSS module files contain hardcoded colors** (`white`, `black`, `#111`, `rgba(0,0,0,0.85)`, etc.) that break in dark theme. Success: dark mode is visually coherent across every route/page without white flashes, unreadable text, or broken contrast.

## Tech Stack

| Dep | Version | Role |
|---|---|---|
| `next-themes` | ^0.4.6 | ThemeProvider, useTheme, `.dark` class toggle |
| `tailwindcss` | ^4.3.1 | Dark variant via `@custom-variant dark` |
| `lucide-react` | (bundled) | Sun/Moon/Monitor icons |
| CSS Modules | -- | Per-component styles |

## Current State

- `globals.css`: Full `:root` (light) and `.dark` theme token sets using OKLCH — **done**.
- `ThemeProvider` in `layout.tsx`: `attribute="class" defaultTheme="system"` — **done**.
- `ThemeToggle.tsx` + `ThemeToggle.module.css`: 3-state cycle (light/dark/system) with CSS-variable-based styling — **done**.
- `Navbar.tsx`: Toggle rendered in `actionsContainer` — **done**.
- `@custom-variant dark` in `globals.css`: Tailwind dark mode wired to `.dark` class — **done**.
- `color-scheme: dark` set in `.dark` block — **done**.

### Gaps

1. **Hardcoded colors in CSS modules.** 60+ instances across 12 component CSS files use raw color values that ignore theme tokens. Examples:
   - `AddToListModal.module.css`: `background: #111`, `color: white`, `color: rgba(255,255,255,0.5)`
   - `AddToListButton.module.css`: `color: white`, `color: black`
   - `AuthModal.module.css`: `border-color: #333`, explicit HSL for success/error states
   - `GameCard.module.css`: `color: white`
   - `Navbar.module.css`: `color: white`
   - And others
2. **No `prefers-color-scheme` flash guard** — SSR renders light before hydration, which causes a white flash on first load for system-dark users.
3. **No transition/animation** for theme switch — immediate swap is jarring.
4. **Theme-color meta tag** is hardcoded `#dc2626` — should change per theme.
5. **Shadcn/Sonner toast theme** may not honor `.dark` class without explicit config.

## Project Structure

```
src/
  app/
    globals.css          # Theme tokens already defined; may need transition + prefers-color-scheme guard
    layout.tsx           # ThemeProvider wrapper, theme-color meta tag
  components/
    ThemeToggle.tsx      # Already exists — may need visual polish
    ThemeToggle.module.css  # Already exists
    *.module.css         # 12+ files need color audit + fix
  providers/
    [ThemeFlashGuard.tsx]  # NEW — prevent SSR flash for system users
```

## Code Style

### CSS Variables (existing pattern, keep)

```css
/* DO: use theme tokens */
background: hsl(var(--muted));
color: hsl(var(--foreground));
border-color: hsl(var(--border) / 0.5);

/* DON'T: hardcode light-optimized colors */
background: #111;       /* bad */
color: white;           /* bad */
color: #333;            /* bad */
```

### Token migration pattern

```css
/* Before */
.success-badge {
  background: hsl(142, 70%, 10%);
  color: hsl(142, 70%, 45%);
}

/* After — use destructuring with theme-independent intent tokens */
/* ponytail: if a semantic token set emerges (--success-bg, --success-fg),
   migrate all at once. For now, these selectors are few enough to inline. */
```

## Testing Strategy

| Level | What | Tool |
|---|---|---|
| Visual audit | Toggle every page route in light + dark mode | Manual (browser DevTools) |
| Contrast check | Text + interactive elements pass WCAG AA | Browser DevTools a11y panel / axe |
| SSR flash | Reload on system-dark preference, no white flash | Manual (`prefers-color-scheme: dark` in DevTools) |
| Persistence | Toggle survives page navigation | Manual |
| System sync | Toggle "System" tracks OS change | Manual |
| E2E smoke | ThemeToggle renders, click cycles 3 states | Playwright |

No unit test for the toggle component itself — it's a thin wrapper over `next-themes`. E2E covers the user-facing behavior.

## Boundaries

### Always do
- Use existing theme token CSS variables (`hsl(var(--foreground))`, `hsl(var(--muted))`, etc.)
- Keep `next-themes` as the single source of truth for theme state
- Test each CSS change in both light and dark mode
- Add transition `color 0.2s, background 0.2s` to visual properties that change
- Run `pnpm build` before marking done

### Ask first
- Adding new CSS theme tokens to `globals.css` (prefer composing from existing ones)
- Changing the toggle's UX behavior (cycle order, icon set, position in nav)
- Any changes to `ThemeProvider` configuration
- Adding a new dependency for theming

### Never do
- Store theme preference in localStorage directly (next-themes handles it)
- Remove or rename existing CSS variables without updating all consumers
- Use `!important` in theme-related CSS
- Add JS-based color switching (CSS variables handle this declaratively)

## Success Criteria

1. [ ] `ThemeToggle` cycles light → dark → system → light on click
2. [ ] All 12+ CSS module files with hardcoded colors use theme token variables instead
3. [ ] Every route loads in dark mode without unreadable text or broken components
4. [ ] No white flash on SSR for users with `prefers-color-scheme: dark`
5. [ ] `theme-color` meta tag updates with theme switch (light = #ffffff, dark = #1a1a1a)
6. [ ] Toast/sonner components respect `.dark` class
7. [ ] `pnpm build` succeeds with no regressions
8. [ ] WCAG AA contrast for all text on both themes

## Open Questions

1. Should the toggle use a **persistent position** (fixed-bottom-right) rather than being inside the nav? On mobile the nav collapses; a fixed toggle is always reachable.
2. Should the system option **indicate the resolved theme** (e.g., "System (dark)") or stay as "System"?
3. Some badge colors (epic deal badge gradient `#ff4b2b → #ff416c`) are brand-intent and should stay. Confirm which hardcoded colors are intentional brand colors vs accidental.
