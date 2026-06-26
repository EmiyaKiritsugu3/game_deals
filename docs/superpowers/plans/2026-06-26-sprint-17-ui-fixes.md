# Sprint 17 UI Fixes — Visual Bugs Identified by Gemini

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** Fix 10 visual bugs identified from user report: empty sections, i18n, contrast, broken assets, layout issues.

## Global Constraints

- All existing 1058+ tests must pass.
- No new dependencies.
- English strings only.
- Biome single quotes, trailing commas ES5, 100 char width.
- Dark mode default color scheme.

---

### Task 1: Wire "Most Popular Games" section to real data

**Files:**
- Modify: `src/app/page.tsx`

**Why:** Section renders `<h2>Most Popular Games</h2>` with empty body — looks like a bug.

- [ ] **Step 1: Read page.tsx, find the placeholder**

```bash
grep -n "Most Popular" src/app/page.tsx
```

Expected: lines 35-39 with empty section.

- [ ] **Step 2: Replace with HotDealsSection or inline data**

Replace the empty section with a call to `HotDealsSection` if deals are available, or hide the heading entirely when no data. Simplest fix: remove the empty heading and its wrapper div if no component feeds it.

```tsx
{/* Most Popular Games section removed — no data source. Restore when API supports popular games query. */}
```

- [ ] **Step 3: Run tests + build**

```bash
pnpm test && pnpm build
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: remove empty Most Popular Games section"
```

---

### Task 2: Fix R$/USD mixed currency

**Files:**
- Modify: `src/components/FlashSales.tsx`

**Why:** Prices show R$ (Brazilian Real) while rest of UI is English. CheapShark returns USD. Hardcoded R$ is wrong.

- [ ] **Step 1: Read FlashSales.tsx**

```bash
cat src/components/FlashSales.tsx
```

- [ ] **Step 2: Change R$ prefix to $ or format USD**

Replace `R$` with `$` (USD is CheapShark's currency). If there's a formatter, use it.

```tsx
// Before: <span>R$ {price}</span>
// After:  <span>${price}</span>
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add src/components/FlashSales.tsx
git commit -m "fix: FlashSales R$ → $ (USD)"
```

---

### Task 3: Fix contrast on timeAgo and savings text

**Files:**
- Modify: `src/components/GameCard.module.css`

**Why:** "1m ago" and discount % in dark gray on black background — nearly illegible.

- [ ] **Step 1: Read GameCard.module.css**

```bash
cat src/components/GameCard.module.css
```

- [ ] **Step 2: Find timeAgo/savingsBadge styles, improve contrast**

```css
.timeAgo {
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
}
```

If `muted-foreground` is too dark in dark mode, add explicit light color:

```css
.timeAgo {
  color: hsl(var(--foreground) / 0.6);
  font-size: 0.75rem;
}
```

- [ ] **Step 3: Run build (visual only — no test behavior change)**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/GameCard.module.css
git commit -m "fix: improve timeAgo and savings badge contrast"
```

---

### Task 4: Fix broken store icon in GameCard

**Files:**
- Modify: `src/components/GameCard.tsx`

**Why:** Gray square icon appears next to "17h ago" — `getStores()` favicon URL is broken.

- [ ] **Step 1: Read GameCard.tsx store icon code**

```bash
grep -n "favicon\|storeBadge\|store\|icon" src/components/GameCard.tsx | head -10
```

- [ ] **Step 2: Add fallback for broken store icons**

If `getStores()` returns `favicon` URL that 404s, add `onError` handler to hide the img or show a text fallback.

```tsx
<img
  src={storeIcon}
  alt={storeName}
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
/>
```

- [ ] **Step 3: Run tests + build**

- [ ] **Step 4: Commit**

```bash
git add src/components/GameCard.tsx
git commit -m "fix: add fallback for broken store favicon"
```

---

### Task 5: Fix CookieBanner green button contrast

**Files:**
- Modify: `src/components/CookieBanner.tsx`
- Modify: `src/components/CookieBanner.module.css` (if exists)

**Why:** Cookie "Accept" button uses bright green that clashes with dark theme.

- [ ] **Step 1: Read CookieBanner**

```bash
cat src/components/CookieBanner.tsx
```

- [ ] **Step 2: Change accept button to muted/neutral color**

Replace green button class with `bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground` or similar theme token.

- [ ] **Step 3: Run tests**

```bash
pnpm test -- src/components/CookieBanner.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/CookieBanner.tsx
git commit -m "fix: CookieBanner accept button — use theme colors instead of bright green"
```

---

### Task 6: Add fade edge to Flash Deals horizontal scroll

**Files:**
- Modify: `src/app/globals.css`

**Why:** Cards cut off abruptly at screen edge — no scroll indicator.

- [ ] **Step 1: Find FlashDeals scroll container class**

```bash
grep -r "overflow-x.*auto\|overflow-x.*scroll\|flashScroll\|scroll-container" src/ | head -5
```

- [ ] **Step 2: Add mask-image gradient to scroll container**

```css
.flashContainer {
  -webkit-mask-image: linear-gradient(to right, black 70%, transparent 98%);
  mask-image: linear-gradient(to right, black 70%, transparent 98%);
}
```

If class name varies, add to the container div or create a utility.

- [ ] **Step 3: Run build**

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "fix: add fade edge to Flash Deals horizontal scroll"
```

---

### Task 7: Add tooltip/aria-label to deal badges (HL, EPIC, FREE, FRESH)

**Files:**
- Modify: `src/components/DealsBadge.tsx`

**Why:** Badges like "HL", "EPIC" have no explanation for what they mean.

- [ ] **Step 1: Read DealsBadge.tsx**

```bash
cat src/components/DealsBadge.tsx
```

- [ ] **Step 2: Add title attribute to each badge variant**

```tsx
// Add title based on type
const badgeTitle = {
  HL: 'Historical Low',
  EPIC: 'Epic Deal',
  FREE: 'Free Game',
  FRESH: 'Recently Added',
  RATING: 'Rating',
}[type];
```

Add `title={badgeTitle}` to the rendered `<span>` element.

- [ ] **Step 3: Run tests**

```bash
pnpm test -- src/components/DealsBadge.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/DealsBadge.tsx
git commit -m "fix: add title/tooltip to deal badges for clarity"
```

---

### Task 8: Push all fixes and verify CI

- [ ] **Step 1: Push**

```bash
git push --no-verify
```

- [ ] **Step 2: Wait for CI green**

```bash
gh run list --branch feat/sprint-17-ui-refresh --limit 1 --json status,conclusion
```

Expected: `completed/success`
