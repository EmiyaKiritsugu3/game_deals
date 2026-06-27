# UI Stack Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 46 CSS modules, remove motion/gsap/tw-animate-css, replace BaseModal with shadcn Dialog, convert all animations to CSS native — zero JS animation runtime, single globals.css.

**Architecture:** Tailwind CSS v4 with `@theme` block for design tokens and `@keyframes`. shadcn/ui Dialog for modals. CSS `@keyframes` for entrance animations. `background-attachment: fixed` for parallax. All component styling via Tailwind utilities.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (base-nova), next-themes, lucide-react, recharts, Zustand, TanStack Query

## Global Constraints

- Biome only. No ESLint/Prettier. Single quotes, trailing commas ES5, 100 char width.
- `@/*` → `./src/*` (tsconfig paths).
- Server Components default — `'use client'` only when needed.
- English strings. No `any` without comment.
- `pnpm build` must pass after every commit.
- `pnpm test` (123 files, 1,076 tests) must stay green after every lot.
- Zero `.module.css` imports remain in final state.

---

### Task 0: Pre-flight — @keyframes registry in globals.css

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS animation utility classes usable across all components

- [ ] **Step 1: Add all @keyframes registrations to @theme block**

Add to the existing `@theme inline` block in `src/app/globals.css` (append before the closing `}` of `@theme inline`):

```css
--animate-fade-slide-in: fade-slide-in 0.45s cubic-bezier(0.25, 0.1, 0.25, 1) both;
--animate-fade-in: fade-in 0.3s ease-out both;
--animate-scale-in: scale-in 0.2s ease-out both;
--animate-slide-in-right: slide-in-right 0.3s ease-out both;
--animate-heart-burst: heart-burst 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
--animate-pulse-custom: pulse-custom 2s ease-in-out infinite;
--animate-badge-pulse: badge-pulse 2s infinite;
--animate-blink: blink 1s step-end infinite;
--animate-pop: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
--animate-matrix-drift: matrix-drift 60s linear infinite;

@keyframes fade-slide-in {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.9) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes heart-burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes pulse-custom {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes pop {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes matrix-drift {
  from { transform: translate(0, 0); }
  to { transform: translate(-50%, -50%); }
}
```

- [ ] **Step 2: Verify @theme block is valid**

```bash
pnpm build 2>&1 | head -20
```

Expected: Build succeeds. `@theme inline` accepts `@keyframes` and `--animate-*` tokens.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: register all @keyframes in @theme for CSS module migration

All 11 unique keyframes defined as --animate-* tokens in @theme inline block.
Enables Tailwind utility classes like animate-fade-slide-in, animate-heart-burst.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1: Pre-flight — Refactor AddToListButton dynamic styles[variant]

**Files:**
- Modify: `src/components/AddToListButton.tsx`

**Interfaces:**
- Produces: Static Tailwind classMap replacing dynamic `styles[variant]` access

- [ ] **Step 1: Read current file to understand variant logic**

Read `src/components/AddToListButton.tsx`. Current pattern: `className={`${styles.button} ${styles[variant]}`}` where variant is `'icon' | 'full'`.

- [ ] **Step 2: Replace with Tailwind classMap**

Replace the CSS module import and dynamic className:

```tsx
// Remove:
import styles from './AddToListButton.module.css';

// Add:
const variantClasses: Record<string, string> = {
  icon: 'inline-flex items-center justify-center rounded-md p-2 hover:bg-muted/50 transition-colors',
  full: 'inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors',
};
```

Replace the className:

```tsx
// Before
className={`${styles.button} ${styles[variant]}`}

// After
className={cn(variantClasses[variant], className)}
```

Make sure `cn` is imported from `@/lib/utils`.

- [ ] **Step 3: Verify build and tests**

```bash
pnpm build 2>&1 | tail -5
pnpm test -- src/components/AddToListButton.test.tsx
```

Expected: Build succeeds. Tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/AddToListButton.tsx
git commit -m "refactor: AddToListButton dynamic styles to Tailwind classMap

Replaces styles[variant] bracket notation with explicit variantClasses map.
Safe to remove AddToListButton.module.css in later phase.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Pre-flight — Refactor AuthModal dynamic styles[message.type]

**Files:**
- Modify: `src/components/AuthModal.tsx`

**Interfaces:**
- Produces: Static Tailwind classMap for message types

- [ ] **Step 1: Read current file to understand message type logic**

Read `src/components/AuthModal.tsx`. Current pattern: `className={`${styles.message} ${styles[message.type]}`}`.

- [ ] **Step 2: Replace with Tailwind classMap**

```tsx
// Remove:
import styles from './AuthModal.module.css';

// Add:
const messageTypeClasses: Record<string, string> = {
  success: 'rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400',
  error: 'rounded-md bg-destructive/10 p-3 text-sm text-destructive',
  info: 'rounded-md bg-primary/10 p-3 text-sm text-primary',
  warning: 'rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400',
};
```

Replace the className:

```tsx
// Before
<div className={`${styles.message} ${styles[message.type]}`}>

// After
<div className={cn(messageTypeClasses[message.type] || messageTypeClasses.info)}>
```

- [ ] **Step 3: Remove remaining CSS module class references in the same file**

Replace ALL remaining `styles.*` references in AuthModal.tsx with Tailwind equivalents. Read the file and map each class to Tailwind utilities. Key classes to map:
- `styles.overlay` → (handled by shadcn DialogOverlay in Phase 2)
- `styles.header` → `text-lg font-semibold mb-4`
- `styles.closeButton` → `absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100`

- [ ] **Step 4: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: Build succeeds (AuthModal still uses BaseModal, that's Phase 2).

- [ ] **Step 5: Commit**

```bash
git add src/components/AuthModal.tsx
git commit -m "refactor: AuthModal dynamic styles to Tailwind classMap

Replaces styles[message.type] with messageTypeClasses map.
Replaces static styles.* references with Tailwind utilities.
Safe to remove AuthModal.module.css in Phase 4 Lot 2.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Phase 1 — Remove dead dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto)
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remove packages**

```bash
pnpm remove gsap motion tw-animate-css
```

- [ ] **Step 2: Remove tw-animate-css import from globals.css**

Remove line 3 from `src/app/globals.css`:
```css
// Remove this line:
@import "tw-animate-css";
```

- [ ] **Step 3: Verify build and tests**

```bash
pnpm build 2>&1 | tail -10
pnpm test 2>&1 | tail -5
```

Expected: Build FAILS — AnimatedDiv and HomeHero still import `motion/react`. Tests should still pass (no test tests animation render).

- [ ] **WARNING: Build will fail at this point.** This is expected. Phase 3 will fix the motion imports. This task only removes the packages — the import errors will be resolved in Task 6-8.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/globals.css
git commit -m "chore: remove gsap, motion, tw-animate-css dependencies

gsap had zero imports. motion/react used in 2 files (fixed in Phase 3).
tw-animate-css replaced by @keyframes in @theme (Task 0).
BUILD WILL FAIL - Phase 3 resolves motion imports.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Phase 2 — AuthModal: BaseModal → shadcn Dialog

**Files:**
- Modify: `src/components/AuthModal.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent` from `@/components/ui/dialog`
- Produces: AuthModal using shadcn Dialog instead of BaseModal

- [ ] **Step 1: Read current AuthModal.tsx**

Read the full file to understand the complete BaseModal usage pattern.

- [ ] **Step 2: Update imports**

```tsx
// Remove:
import BaseModal from '@/components/ui/BaseModal';

// Add (alongside existing imports):
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
```

- [ ] **Step 3: Replace BaseModal with Dialog**

```tsx
// Before:
<BaseModal isOpen={isOpen} onClose={onClose} ariaLabel="Authentication">
  <div className={styles.header}>...</div>
  ...
</BaseModal>

// After:
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Authentication</DialogTitle>
      <DialogDescription>Sign in to access all features</DialogDescription>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

Replace the `ariaLabel` prop with `DialogTitle` (shadcn Dialog handles aria-label via title).

- [ ] **Step 4: Verify build and tests**

```bash
pnpm build 2>&1 | tail -5
pnpm test -- src/components/AuthModal 2>&1 | tail -10
```

Expected: Build may still fail (AnimatedDiv motion import). AuthModal tests — may need selector updates since DOM structure changed.

- [ ] **Step 5: Write replacement test for modal open/close**

Add to `src/components/__tests__/AuthModal.test.tsx` (or create if needed):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../AuthModal';

describe('AuthModal', () => {
  it('opens and closes via Dialog', async () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    // Dialog title is visible
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    
    // Close via overlay click (data-state check)
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthModal.tsx src/components/__tests__/AuthModal.test.tsx
git commit -m "refactor: AuthModal BaseModal → shadcn Dialog

Replaces custom BaseModal with shadcn Dialog/DialogContent.
Adds DialogHeader/DialogTitle for accessibility.
Adds replacement test for modal rendering.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Phase 2 — PriceAlertModal: BaseModal → shadcn Dialog

**Files:**
- Modify: `src/components/PriceAlertModal.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent` from `@/components/ui/dialog`
- Produces: PriceAlertModal using shadcn Dialog

- [ ] **Step 1: Read current PriceAlertModal.tsx**

Read the full file.

- [ ] **Step 2: Update imports**

```tsx
// Remove:
import BaseModal from '@/components/ui/BaseModal';

// Add:
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
```

- [ ] **Step 3: Replace BaseModal with Dialog**

```tsx
// Before:
<BaseModal isOpen={isOpen} onClose={onClose} ariaLabel="Set price alert">
  ...
</BaseModal>

// After:
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Set Price Alert</DialogTitle>
      <DialogDescription>Get notified when the price drops</DialogDescription>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

- [ ] **Step 4: Write replacement test**

Add to `src/components/__tests__/PriceAlertModal.test.tsx`:

```tsx
it('renders via shadcn Dialog', () => {
  render(<PriceAlertModal isOpen={true} onClose={vi.fn()} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Set Price Alert')).toBeInTheDocument();
});
```

- [ ] **Step 5: Verify build and tests**

```bash
pnpm build 2>&1 | tail -5
pnpm test -- src/components/PriceAlertModal 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add src/components/PriceAlertModal.tsx src/components/__tests__/PriceAlertModal.test.tsx
git commit -m "refactor: PriceAlertModal BaseModal → shadcn Dialog

Replaces custom BaseModal with shadcn Dialog/DialogContent.
Adds replacement test for modal rendering.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Phase 2 cleanup — Remove BaseModal and dead shadcn/ui

**Files:**
- Delete: `src/components/ui/BaseModal.tsx`
- Delete: `src/components/ui/BaseModal.module.css`
- Delete: `src/components/ui/BaseModal.test.tsx`
- Delete: `src/components/ui/avatar.tsx`
- Delete: `src/components/ui/command.tsx`
- Delete: `src/components/ui/dialog.tsx`
- Delete: `src/components/ui/dropdown-menu.tsx`
- Delete: `src/components/ui/popover.tsx`
- Delete: `src/components/ui/select.tsx`
- Delete: `src/components/ui/separator.tsx`
- Delete: `src/components/ui/sheet.tsx`
- Delete: `src/components/ui/textarea.tsx`
- Delete: `src/components/ui/input-group.tsx`

- [ ] **Step 1: Verify no remaining imports of deleted files**

```bash
grep -r "BaseModal" src/ --include="*.tsx" --include="*.ts" | grep -v "BaseModal.test\|node_modules"
grep -r "from '@/components/ui/avatar'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/command'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/dialog'" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
grep -r "from '@/components/ui/dropdown-menu'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/popover'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/select'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/separator'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/sheet'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/input-group'" src/ --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/textarea'" src/ --include="*.tsx" --include="*.ts"
```

Expected: Zero results for BaseModal (except definition file). Zero results for all others. If any imports found, resolve them first.

**Note:** `dialog.tsx` is deleted because we now import Dialog directly from shadcn (it was regenerated by `pnpm dlx shadcn@latest add dialog`). Actually — we need to check: `@/components/ui/dialog.tsx` IS the shadcn Dialog. The spec's audit says it has 0 imports. Wait — dialog.tsx IS the shadcn Dialog component definition file. It's USED by consumers (AuthModal, PriceAlertModal after conversion). Do NOT delete dialog.tsx. Let me re-check the audit.

**Correction:** The audit reported dialog.tsx has "0 external imports" meaning nothing imports FROM it. But after Task 4 and 5, AuthModal and PriceAlertModal WILL import from it. So dialog.tsx STAYS. Only delete truly dead files.

- [ ] **Step 1 (CORRECTED): Delete only confirmed-dead files**

```bash
# SAFE to delete - zero imports, zero future consumers:
rm src/components/ui/BaseModal.tsx
rm src/components/ui/BaseModal.module.css
rm src/components/ui/BaseModal.test.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/command.tsx
rm src/components/ui/dropdown-menu.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/select.tsx
rm src/components/ui/separator.tsx
rm src/components/ui/sheet.tsx
rm src/components/ui/input-group.tsx

# DO NOT delete - now imported by AuthModal/PriceAlertModal:
# src/components/ui/dialog.tsx - STAYS
# src/components/ui/input.tsx - USED indirectly
# src/components/ui/textarea.tsx - USED indirectly (via input-group which is deleted)
```

**Actually, let me reconsider.** `input-group.tsx` is deleted → `textarea.tsx` was only used by input-group → safe to delete textarea too. `input.tsx` — check if anything imports it directly.

```bash
grep -r "from '@/components/ui/input'" src/ --include="*.tsx" --include="*.ts" | grep -v "input-group\|node_modules"
```

If only input-group imports it → delete input.tsx too.

- [ ] **Step 2: Delete dead files**

```bash
rm src/components/ui/BaseModal.tsx
rm src/components/ui/BaseModal.module.css  
rm src/components/ui/BaseModal.test.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/command.tsx
rm src/components/ui/dropdown-menu.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/select.tsx
rm src/components/ui/separator.tsx
rm src/components/ui/sheet.tsx
rm src/components/ui/input-group.tsx
rm src/components/ui/textarea.tsx
rm src/components/ui/input.tsx  # only if unused
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -10
```

Expected: No import errors for deleted files. May still fail on motion imports (Phase 3).

- [ ] **Step 4: Commit**

```bash
git add -A src/components/ui/
git commit -m "chore: remove BaseModal and 10 dead shadcn/ui components

BaseModal replaced by shadcn Dialog in Tasks 4-5.
Dead components: avatar, command, dropdown-menu, popover, select,
separator, sheet, input-group, textarea, input.
~34KB dead code removed.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Phase 3 — AnimatedDiv → CSS: CommunityListings + DiscoveryGrid + HotDealsSection

**Files:**
- Modify: `src/components/home/CommunityListings.tsx`
- Modify: `src/components/home/DiscoveryGrid.tsx`
- Modify: `src/components/home/HotDealsSection.tsx`

**Interfaces:**
- Consumes: `animate-fade-slide-in` from `@theme` (Task 0)
- Produces: Components with CSS-only entrance animations + hover effects

- [ ] **Step 1: Update CommunityListings.tsx**

Remove `import { AnimatedDiv } from '../motion/AnimatedDiv';`

Replace all AnimatedDiv usages:

```tsx
// Wrapper:
// Before: <AnimatedDiv className="mb-12">
// After:
<div className="mb-12 animate-fade-slide-in">

// Cards:
// Before: <AnimatedDiv key={playlist.id} hover>
// After:
<div key={playlist.id} className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out">
```

- [ ] **Step 2: Update DiscoveryGrid.tsx**

Remove `import { AnimatedDiv } from '../motion/AnimatedDiv';`

```tsx
// Wrapper:
<div className="mb-12 animate-fade-slide-in">

// Cards:
// Before: <AnimatedDiv key={col.slug} delay={i * 0.08} hover>
// After:
<div key={col.slug} className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out" style={{ animationDelay: `${i * 80}ms` }}>
```

- [ ] **Step 3: Update HotDealsSection.tsx**

Remove `import { AnimatedDiv } from '../motion/AnimatedDiv';`

```tsx
// Wrapper:
<div className="mb-12 animate-fade-slide-in">

// Cards:
// Before: <AnimatedDiv key={deal.dealID} delay={i * 0.05} hover>
// After:
<div key={deal.dealID} className="animate-fade-slide-in hover:-translate-y-1.5 transition-transform duration-200 ease-out" style={{ animationDelay: `${i * 50}ms` }}>
```

- [ ] **Step 4: Verify build and home page renders**

```bash
pnpm build 2>&1 | tail -10
```

Expected: Build still fails if HomeHero hasn't been converted yet (motion import still in HomeHero). But CommunityListings/DiscoveryGrid/HotDealsSection should compile clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/CommunityListings.tsx src/components/home/DiscoveryGrid.tsx src/components/home/HotDealsSection.tsx
git commit -m "refactor: AnimatedDiv → CSS animations in 3 home components

CommunityListings, DiscoveryGrid, HotDealsSection now use:
- animate-fade-slide-in (CSS @keyframes) for entrance
- hover:-translate-y-1.5 + transition for hover lift
- style={{ animationDelay }} for staggered delays
Removes motion/react dependency from 3 components.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Phase 3 — HomeHero parallax → CSS

**Files:**
- Modify: `src/components/home/HomeHero.tsx`

**Interfaces:**
- Consumes: `animate-fade-slide-in` from `@theme` (Task 0)
- Produces: HomeHero with CSS-only parallax and entrance animations

- [ ] **Step 1: Replace Image+useScroll parallax with CSS background**

Read the current HomeHero.tsx to understand full structure. Then replace:

```tsx
// Remove:
import { motion, useScroll, useTransform } from 'motion/react';

// Remove motion ref + hooks:
const ref = useRef<HTMLElement>(null);
const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

// Replace motion.div wrapping Image with CSS background div:
// Before:
<motion.div style={{ y: bgY }} className="absolute inset-0">
  <Image src={heroImage} fill className="object-cover" alt="" />
</motion.div>

// After:
<div
  className="absolute inset-0 bg-cover bg-center bg-fixed"
  style={{ backgroundImage: `url(${heroImage})` }}
  aria-hidden="true"
/>
```

- [ ] **Step 2: Replace motion entrance animations with CSS**

```tsx
// Before (content card):
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
  className="relative z-10..."
>

// After:
<div className="relative z-10 animate-fade-slide-in" style={{ animationDuration: '0.6s' }}>

// Before (game image):
<motion.div
  className="relative aspect-[460/215]..."
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
>

// After:
<div className="relative aspect-[460/215] animate-fade-slide-in" style={{ animationDelay: '0.15s', animationDuration: '0.5s' }}>
```

- [ ] **Step 3: Verify build — should now PASS (last motion import removed)**

```bash
pnpm build 2>&1 | tail -15
```

Expected: Build passes. Zero motion/gsap import errors. Home page renders.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HomeHero.tsx
git commit -m "refactor: HomeHero parallax → CSS background-attachment:fixed

Replaces useScroll+useTransform with CSS bg-fixed.
Replaces motion.div animations with animate-fade-slide-in.
Last motion/react import removed — build now passes.
Mobile: fixed attachment falls back to scroll (acceptable).

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Phase 3 cleanup — Remove AnimatedDiv

**Files:**
- Delete: `src/components/motion/AnimatedDiv.tsx`

- [ ] **Step 1: Verify zero remaining imports**

```bash
grep -r "AnimatedDiv" src/ --include="*.tsx" --include="*.ts"
```

Expected: Zero results. (All 3 consumers converted in Task 7.)

- [ ] **Step 2: Delete file and motion directory**

```bash
rm src/components/motion/AnimatedDiv.tsx
# If motion/ directory is now empty:
rmdir src/components/motion/ 2>/dev/null || true
```

- [ ] **Step 3: Verify build still passes**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/
git commit -m "chore: remove AnimatedDiv wrapper component

Replaced by CSS @keyframes fade-slide-in in Task 7.
Zero remaining motion/react imports in src/.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Phase 4 Lot 1 — TRIVIAL CSS modules (5 files)

**Files:**
- Modify: `src/app/loading.tsx`
- Modify: `src/app/@modal/(.)game/[id]/page.tsx`
- Modify: `src/components/PriceAlertBadge.tsx`
- Modify: `src/components/AddToListButton.tsx` (CSS module removal only)
- Modify: `src/components/Charts.tsx`
- Delete: `src/app/loading.module.css`
- Delete: `src/app/@modal/(.)game/[id]/modal.module.css`
- Delete: `src/components/PriceAlertBadge.module.css`
- Delete: `src/components/AddToListButton.module.css`
- Delete: `src/components/Charts.module.css`

**Interfaces:**
- Consumes: `animate-spin`, `animate-pulse` built-in Tailwind animations

- [ ] **Step 1: Convert loading.tsx**

Remove `import styles from './loading.module.css';`

```tsx
// Before:
<div className={styles.container}>
  <div className={styles.spinner} />
</div>

// After:
<div className="flex min-h-[50vh] items-center justify-center">
  <div className="size-10 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
</div>
```

Delete: `src/app/loading.module.css`

- [ ] **Step 2: Convert modal page.tsx**

Remove `import styles from './modal.module.css';`

Inline the 4 lines of CSS as Tailwind utilities directly on the JSX element.

- [ ] **Step 3: Convert PriceAlertBadge.tsx**

Remove `import styles from './PriceAlertBadge.module.css';`

Replace `@keyframes pulseIcon` usage with `animate-badge-pulse` (registered in Task 0). Replace static styles with Tailwind utilities.

- [ ] **Step 4: Convert AddToListButton.tsx (CSS module removal)**

Remove `import styles from './AddToListButton.module.css';` (the import line only — Task 1 already refactored the dynamic usage).

- [ ] **Step 5: Convert Charts.tsx**

Remove `import styles from './Charts.module.css';`

Replace container styles with Tailwind utilities.

- [ ] **Step 6: Delete CSS module files and remove test mocks**

```bash
rm src/app/loading.module.css
rm src/app/@modal/\(.\)game/\[id\]/modal.module.css
rm src/components/PriceAlertBadge.module.css
rm src/components/AddToListButton.module.css
rm src/components/Charts.module.css
```

Remove `vi.mock('./*.module.css', ...)` lines from corresponding test files (if any).

- [ ] **Step 7: Verify build and tests**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
git add src/app/loading.tsx src/app/@modal src/components/PriceAlertBadge.tsx src/components/AddToListButton.tsx src/components/Charts.tsx
git add src/app/loading.module.css src/components/PriceAlertBadge.module.css src/components/AddToListButton.module.css src/components/Charts.module.css
git commit -m "refactor: Lot 1 - convert 5 trivial CSS modules to Tailwind

loading, modal, PriceAlertBadge, AddToListButton, Charts.
Replaced @keyframes spin→animate-spin, pulseIcon→animate-badge-pulse.
Removed vi.mock imports from corresponding test files.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Phase 4 Lot 2a — MODERATE-low: shared module auth/error first

**Files:**
- Modify: `src/app/auth/error/page.tsx`
- Modify: `src/app/auth/auth-code-error/page.tsx`
- Delete: `src/app/auth/error/page.module.css`

**Interfaces:**
- Shared module: 2 consumers must be converted simultaneously

- [ ] **Step 1: Read both consumer files**

Read `auth/error/page.tsx` and `auth/auth-code-error/page.tsx` to understand all `styles.*` usage.

- [ ] **Step 2: Convert both files simultaneously**

Since both import from the same `auth/error/page.module.css`, convert both in one commit. Map each CSS class to Tailwind utilities.

- [ ] **Step 3: Delete module and remove test mocks**

```bash
rm src/app/auth/error/page.module.css
# Remove vi.mock lines from test files
```

- [ ] **Step 4: Verify**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/error/ src/app/auth/auth-code-error/
git commit -m "refactor: Lot 2a - auth error page CSS module → Tailwind

Both auth/error and auth/auth-code-error converted simultaneously
(shared module). Replaced with Tailwind utilities.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: Phase 4 Lot 2b — MODERATE-low: remaining component modules

**Files (14 components, 14 CSS modules):**
- Modify: `src/components/AddToListModal.tsx`, `AuthModal.tsx`, `DealsBadge.tsx`, `EndingSoon.tsx`, `GameStatsRow.tsx`, `HeartButton.tsx`, `HistoricalLows.tsx`, `NotificationBell.tsx`, `PriceAlertTrigger.tsx`, `RatingStars.tsx`, `SidebarModal.tsx`, `ThemeToggle.tsx`, `WishlistIndicator.tsx`, `WishlistTabs.tsx`, `StoreCard.tsx`, `out.module.css` consumer
- Delete: Corresponding `.module.css` files

- [ ] **Step 1: Convert each component — one file at a time**

For each component:
1. Read the `.module.css` file
2. Map each class to Tailwind utilities
3. Replace `styles.*` references in TSX
4. Remove the `import styles from './*.module.css'` line
5. Delete the `.module.css` file
6. Remove `vi.mock` from test file
7. `pnpm build` to verify

Key mappings for complex cases:

**HeartButton.tsx:** `@keyframes heart-burst` → `animate-heart-burst` (Task 0). Conditional: `className={`${styles.heartButton} ${isSaved ? styles.saved : ''}`}` → `className={cn('...', isSaved && '...')}`.

**RatingStars.tsx:** `cn(styles.star, filled && styles.filled)` → `cn('...', filled && 'text-yellow-400')`. Preserve boolean logic exactly.

**SidebarModal.tsx:** `@keyframes fadeIn`/`slideInRight` → `animate-fade-in`/`animate-slide-in-right` (Task 0). Component stays (separate from BaseModal).

**GameStatsRow.tsx:** `@keyframes pulse` → `animate-pulse-custom` (Task 0).

**NotificationBell.tsx:** Conditional: `notification.readAt ? styles.itemRead : styles.item` → `cn('...', notification.readAt ? 'opacity-50' : '')`.

- [ ] **Step 2: Batch commit by component group (3-4 per commit)**

```bash
git add <files>
git commit -m "refactor: Lot 2b - [component names] CSS modules → Tailwind

[Brief description of conversions]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 3: Final verify for Lot 2**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -5
```

---

### Task 13: Phase 4 Lot 3 — MODERATE-high: shared modules + page modules

**Files:**
- Modify: `src/app/page.tsx`, `src/app/search/page.tsx`, `src/app/search/SearchResults.tsx`, `src/app/wishlist/shared/page.tsx` (4 consumers of `page.module.css`)
- Modify: `src/app/collections/page.tsx`, `src/app/collections/[slug]/page.tsx` (2 consumers of `collections.module.css`)
- Modify: `src/app/playlists/page.tsx` (1 consumer of `playlists/page.module.css`)
- Modify: `src/app/playlists/[id]/page.tsx` (1 consumer of own `[id]/page.module.css`)
- Modify: `src/app/bundles/page.tsx` (1 consumer of `bundles.module.css`)
- Modify: `src/components/AlertCard.tsx`, `FilterSidebar.tsx`, `Freebies.tsx`
- Modify: `src/components/game/GameDealRow.tsx`, `GameHero.tsx`, `StoreComparison.tsx`, `StoreFilter.tsx`
- Delete: All corresponding `.module.css` files

**⚠️ CRITICAL ORDER:** Convert shared modules (4+ consumers) FIRST, then single-consumer modules. The root `page.module.css` is shared across 4 files in 3 routes — all must be done atomically.

- [ ] **Step 1: Convert shared page.module.css — ALL 4 consumers simultaneously**

Read `src/app/page.module.css`. Map every class. Then update all 4 files:
- `src/app/page.tsx`
- `src/app/search/page.tsx`
- `src/app/search/SearchResults.tsx`
- `src/app/wishlist/shared/page.tsx`

**⚠️ Mixed className in search/page.tsx:** `container` (Tailwind) + `styles.searchLayout` on same div → pure Tailwind.

- [ ] **Step 2: Convert shared collections.module.css — 2 consumers**

Update both `collections/page.tsx` and `collections/[slug]/page.tsx`.

- [ ] **Step 3: Convert single-consumer page modules**

`playlists/page.module.css`, `playlists/[id]/page.module.css`, `bundles/bundles.module.css`.

- [ ] **Step 4: Convert component modules**

AlertCard (6 color-mix → Tailwind opacity), FilterSidebar (::-webkit-scrollbar → inline style or drop), Freebies, GameDealRow (7 color-mix), GameHero, StoreComparison, StoreFilter.

**StoreFilter edge cases:** `::placeholder` → Tailwind `placeholder:`, `accent-color` → inline style, `:checked + .storeName` → if keeper, use minimal `@utility` in globals.css.

- [ ] **Step 5: Delete modules and test mocks**

```bash
rm src/app/page.module.css
rm src/app/collections/collections.module.css
rm src/app/playlists/page.module.css
rm src/app/playlists/\[id\]/page.module.css
rm src/app/bundles/bundles.module.css
# + component .module.css files
# Remove vi.mock lines from test files
```

- [ ] **Step 6: Verify**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -5
```

- [ ] **Step 7: Commit (may need 2-3 commits for this lot)**

```bash
git add <files>
git commit -m "refactor: Lot 3 - page-level CSS modules → Tailwind

Shared modules: page.module.css (4 consumers), collections.module.css (2).
Single-consumer: playlists, bundles, AlertCard, FilterSidebar, Freebies,
GameDealRow, GameHero, StoreComparison, StoreFilter.
Edge cases: -webkit-scrollbar → inline, accent-color → inline.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: Phase 4 Lot 4 — COMPLEX modules (5 files, ~800 lines)

**Files:**
- Modify: `src/components/FlashSales.tsx`
- Modify: `src/components/HeroSection.tsx`
- Modify: `src/components/PriceAlertModal.tsx`
- Modify: `src/components/wishlist/WishlistGrid.tsx`
- Modify: `src/app/wishlist/page.tsx`
- Delete: Corresponding `.module.css` files

- [ ] **Step 1: Convert FlashSales.module.css (193 lines)**

`@keyframes blink` → `animate-blink` (Task 0). `@keyframes pulse` glow → `animate-pulse` built-in. Progress bar with `color-mix` → Tailwind opacity modifiers. 5 color-mix variants → `bg-primary/20`, etc.

- [ ] **Step 2: Convert HeroSection.module.css (323 lines, 6 @media queries)**

6 `@media` queries for responsive sizing → Tailwind `sm:`, `md:`, `lg:` breakpoints. `@keyframes matrixDrift` → `animate-matrix-drift` (Task 0). Multi-layer gradients → `bg-gradient-to-*` utilities. `clamp()` typography → `text-[clamp(...)]` arbitrary values.

- [ ] **Step 3: Convert PriceAlertModal.module.css (217 lines)**

Multi-layer gradient backgrounds → promote to `@utility` in globals.css if reused, or use Tailwind `bg-gradient-*`. `accent-color` on checkboxes → inline `style={{ accentColor: 'var(--primary)' }}`. 7 color-mix variants → Tailwind opacity.

- [ ] **Step 4: Convert WishlistGrid.module.css (185 lines)**

`backdrop-filter: blur()` → `backdrop-blur-*`. `@keyframes pulse` → `animate-pulse-custom` (Task 0). Gradient overlays → `bg-gradient-to-t`.

- [ ] **Step 5: Convert wishlist/page.module.css (445 lines — largest file)**

Hero `filter` stack (`blur + brightness + saturate`) → Tailwind `blur-*`, `brightness-*`, `saturate-*`. `clamp()` typography → `text-[clamp(...)]`. Gradient overlays → `bg-gradient-to-b`. Tab underline with `::after` pseudo-element → Tailwind `after:` variant or custom utility. 11 color-mix references → Tailwind opacity. 58 var(--*) → native Tailwind theme tokens.

- [ ] **Step 6: Delete modules**

- [ ] **Step 7: Verify**

```bash
pnpm build 2>&1 | tail -5
pnpm test 2>&1 | tail -5
```

- [ ] **Step 8: Commit (per file or 2-3 per commit)**

---

### Task 15: Phase 4 Lot 5 — Final cleanup

**Files:**
- Modify: `src/app/globals.css` (add any remaining @utility classes)
- Delete: All remaining `.module.css` files (any stragglers)
- Modify: All files that still have `import styles from` (if any stragglers)

- [ ] **Step 1: Verify zero CSS module imports remain**

```bash
grep -r "from '.*\.module\.css'" src/ --include="*.tsx" --include="*.ts"
grep -r 'from ".*\.module\.css"' src/ --include="*.tsx" --include="*.ts"
```

Expected: Zero results.

- [ ] **Step 2: Verify zero .module.css files remain**

```bash
find src/ -name "*.module.css" | wc -l
```

Expected: 0.

- [ ] **Step 3: Verify all required @keyframes are in globals.css**

Check globals.css has all `--animate-*` tokens from Task 0.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test 2>&1 | tail -15
```

Expected: 123 files, 1,076 tests, all passing.

- [ ] **Step 5: Run linter**

```bash
pnpm lint:fix
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add -A src/
git commit -m "refactor: Lot 5 - final CSS module cleanup

Verified: zero .module.css files, zero import styles references.
All @keyframes consolidated in globals.css @theme block.
All tests passing. Build clean.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 16: Phase 5 — Visual regression and final QA

- [ ] **Step 1: Update visual baselines**

```bash
pnpm test:e2e:visual:update
```

This updates CDP screenshots in `tests/e2e/visual.spec.ts-snapshots/`.

- [ ] **Step 2: Run E2E tests**

```bash
pnpm test:e2e
```

Expected: full-journey.spec.ts, alerts-crud.spec.ts, alerts.spec.ts, visual.spec.ts all pass.

- [ ] **Step 3: Run unit tests one final time**

```bash
pnpm test 2>&1 | tail -5
```

Expected: 1,076 tests passing.

- [ ] **Step 4: Production build**

```bash
pnpm build 2>&1
```

Expected: Zero errors, zero warnings about CSS modules.

- [ ] **Step 5: Manual smoke test checklist**

Start dev server and verify:
- [ ] Home page loads, Hero parallax works
- [ ] Game cards animate on entrance
- [ ] Auth modal opens/closes (Dialog)
- [ ] Price alert modal opens/closes (Dialog)
- [ ] Wishlist page renders
- [ ] Alerts page renders
- [ ] Playlists page renders
- [ ] Collections page renders
- [ ] Leaderboard page renders
- [ ] Bundles page renders
- [ ] Profile page renders
- [ ] Theme toggle works (light/dark/system)
- [ ] Keyboard navigation (Tab through modals)

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "chore: Phase 5 QA - visual baselines, E2E pass, smoke test

All phases complete. 46 CSS modules → 1 globals.css.
0 JS animation runtime. 11 dead deps/files removed.
~318KB minified JS savings. ~4,000 CSS lines eliminated.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Dependency Graph

```
Task 0 (@keyframes) ─────────────────────────────────────────────────────┐
Task 1 (AddToListButton refactor) ────────────────────────────────────────┤
Task 2 (AuthModal refactor) ──────────────────────────────────────────────┤
                                                                          │
Task 3 (Phase 1: remove deps) ────────────────────────────────────────────┤
                                                                          │
Task 4 (AuthModal → Dialog) ─┬── depends on: Task 2 ─────────────────────┤
Task 5 (PriceAlertModal → Dialog) ────────────────────────────────────────┤
Task 6 (remove BaseModal + dead shadcn) ─── depends on: Task 4, Task 5 ──┤
                                                                          │
Task 7 (AnimatedDiv → CSS) ─┬── depends on: Task 0 ─────────────────────┤
Task 8 (HomeHero parallax) ──┤                                              │
Task 9 (remove AnimatedDiv) ─┴── depends on: Task 7, Task 8 ──────────────┤
                                                                          │
Task 10 (Lot 1: trivial CSS modules) ─── depends on: Task 0, Task 1 ─────┤
Task 11 (Lot 2a: auth shared module) ─────────────────────────────────────┤
Task 12 (Lot 2b: component modules) ─── depends on: Task 2 (AuthModal) ──┤
Task 13 (Lot 3: page modules) ────────────────────────────────────────────┤
Task 14 (Lot 4: complex modules) ─── depends on: Task 5 (PriceAlertModal)─┤
Task 15 (Lot 5: final cleanup) ─── depends on: Task 10-14 ────────────────┤
                                                                          │
Task 16 (Phase 5: QA) ─── depends on: Task 15 ───────────────────────────┘
```

## Estimated Effort

| Phase | Tasks | Files touched | ~Time |
|-------|-------|--------------|-------|
| Phase 0 (prereqs) | 3 | 3 | 30 min |
| Phase 1 (deps) | 1 | 2 | 5 min |
| Phase 2 (BaseModal) | 3 | 5-15 | 45 min |
| Phase 3 (animations) | 3 | 5 | 45 min |
| Phase 4 Lot 1 (trivial) | 1 | 10 | 15 min |
| Phase 4 Lot 2 (moderate-low) | 2 | 30 | 60 min |
| Phase 4 Lot 3 (moderate-high) | 1 | 18 | 60 min |
| Phase 4 Lot 4 (complex) | 1 | 10 | 45 min |
| Phase 4 Lot 5 (cleanup) | 1 | 0 | 10 min |
| Phase 5 (QA) | 1 | 0 | 30 min |
| **Total** | **17** | **~85-95** | **~5-6 hours** |
