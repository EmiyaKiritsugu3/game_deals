
## Task 2 - Knip ignoreDependencies

- `knip.json` já existia com `ignoreDependencies: ["@playwright/test"]`
- `tailwindcss` e `@tailwindcss/postcss` adicionados ao array
- Knip exit code 1 é de pre-existing "file"/"type" warnings, não dependency warnings
- `tailwindcss` não aparece mais no output do knip
- `@tailwindcss/postcss` aparece como "configuration hint" (Remove from ignoreDependencies) — knip detecta que é usado via postcss config
- Sem warnings de unused dependency para ambos

## Task 1 — Count violations + image hostnames

### Biome rule violation counts (CORRECTED)
Real counts from `./node_modules/.bin/biome check` with rules at `"error"`:
- `noDangerouslySetInnerHtml`: 2 (layout.tsx:108, game/`[id]`/page.tsx:170)
- `noNonNullAssertion`: 1 (drizzle.config.ts:12)
- `noArrayIndexKey`: 3 (wishlist/shared/page.tsx, Charts.tsx, HeroSection.tsx)
- `useSemanticElements`: 1 (PriceAlertModal.tsx)

Method: Used `./node_modules/.bin/biome check .` (NOT `pnpm lint`/`rtk lint`).

### Image hostnames
Two Steam CDN hostnames serve images:
1. `cdn.cloudflare.steamstatic.com` — 20 header.jpg URLs
2. `shared.fastly.steamstatic.com` — 6 capsule_231x87.jpg URLs

26+ store hostnames found in affiliate config.

## Task 3-4 — Replace global biome `"off"` rules with overrides

### Changes to biome.json
- Removed 4 global `"off"` rules: `noArrayIndexKey`, `noDangerouslySetInnerHtml`, `useSemanticElements`, `noNonNullAssertion`
- Added 2 overrides:
  1. `noDangerouslySetInnerHtml: "off"` for `layout.tsx` + `game/[id]/page.tsx`
  2. `noNonNullAssertion: "off"` for `drizzle.config.ts`
- `noArrayIndexKey` + `useSemanticElements`: 0 violations in overridden files → removed entirely without override

### Biome glob escaping
- Brackets in glob paths (`[id]`) must be escaped as `\\[id\\]` in JSON — Biome treats `[]` as character class in glob syntax
- Error message: "Character class `[]` are not supported. Use `\[` and `\]` to escape the characters."

### Code fixes required (7 violations exposed by removing global `"off"`):
1. `wishlist/shared/page.tsx:119` — `noArrayIndexKey`: Changed key from `` `$`{game.gameID}-$`{idx}` `` to `game.gameID` (removed unused `idx` param)
2. `Charts.tsx:71` — `noArrayIndexKey`: Added `// biome-ignore lint/suspicious/noArrayIndexKey` (static sorted list)
3. `HeroSection.tsx:44` — `noArrayIndexKey`: Added `// biome-ignore lint/suspicious/noArrayIndexKey` (static 15-item bg grid)
4. `HeroSection.tsx:103` — `noNonNullAssertion`: Changed `getStoreLogo(deal.storeID)!` to `getStoreLogo(deal.storeID) ?? ''`
5. `usePriceHistory.ts:12,25` — `noNonNullAssertion`: Changed `gameId!` to `gameId ?? ''`
6. `PriceAlertModal.tsx:132` — `useSemanticElements`: Added `{/* biome-ignore lint/a11y/useSemanticElements */}` (custom styled checkbox)

### Biome-ignore comments in JSX
- In JSX, biome-ignore comments MUST use `{/* biome-ignore ... */}` JSX comment syntax
- `// biome-ignore ...` inside JSX is treated as text content (triggers `noCommentText`)
- The comment must be before the element, not between element attributes

### Verification
- `./node_modules/.bin/biome check .` passes with 0 errors
- Evidence saved to `.sisyphus/evidence/task-3-4-*.txt`
