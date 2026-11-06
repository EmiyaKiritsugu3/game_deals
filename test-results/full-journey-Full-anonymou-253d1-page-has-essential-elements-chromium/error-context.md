# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-journey.spec.ts >> Full anonymous journey >> home page has essential elements
- Location: tests/e2e/full-journey.spec.ts:68:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /GameDeals|game.deals/i
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    14 × locator resolved to <html>…</html>
       - unexpected value ""

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | import { expect, type Page, test } from '@playwright/test';
  2  |
  3  | async function blockProblematicRequests(page: Page) {
  4  |   await page.route('**/*', async (route) => {
  5  |     const url = route.request().url();
  6  |     const u = new URL(url);
  7  |     const pathname = u.pathname;
  8  |
  9  |     if (
  10 |       u.search.includes('_rsc') ||
  11 |       pathname.startsWith('/_next/image') ||
  12 |       pathname.includes('.woff2') ||
  13 |       pathname.includes('.woff') ||
  14 |       pathname.includes('.ttf') ||
  15 |       pathname.includes('favicon.ico')
  16 |     ) {
  17 |       await route.abort();
  18 |     } else {
  19 |       await route.continue();
  20 |     }
  21 |   });
  22 | }
  23 |
  24 | test.describe('Full anonymous journey', () => {
  25 |   test.beforeEach(async ({ page }) => {
  26 |     test.setTimeout(120_000);
  27 |     page.setDefaultTimeout(120_000);
  28 |     await blockProblematicRequests(page);
  29 |   });
  30 |
  31 |   test('browse deals, search, view game detail', async ({ page }) => {
  32 |     // 1. Home page loads with deals (deal cards are links to /game/[id])
  33 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  34 |     // Skip if game data unavailable (CheapShark rate limit)
  35 |     const dealCard = page.locator('a[href^="/game/"]').first();
  36 |     if (!(await dealCard.isVisible({ timeout: 10000 }).catch(() => false))) {
  37 |       test.skip(true, 'Game data unavailable (CheapShark rate limit)');
  38 |       return;
  39 |     }
  40 |     await expect(dealCard).toBeVisible({ timeout: 15000 });
  41 |
  42 |     // 2. Search for a game
  43 |     const searchInput = page.locator(
  44 |       'input[type="search"], input[placeholder*="earch"], input[name="search"]'
  45 |     );
  46 |     await searchInput.first().fill('Witcher');
  47 |     // SearchBox renders dropdown with Link[href^="/game/"] children
  48 |     const searchResult = page.locator('a[href^="/game/"]').first();
  49 |     await expect(searchResult).toBeVisible({ timeout: 10000 });
  50 |
  51 |     // 3. Click first search result -> game detail
  52 |     await searchResult.click();
  53 |
  54 |     // 4. Game detail page/modal loads
  55 |     await expect(page.locator('h1, h2, [data-testid="game-title"]').first()).toBeVisible({
  56 |       timeout: 10000,
  57 |     });
  58 |   });
  59 |
  60 |   test('affiliate redirect validates store and returns no 500', async ({ page }) => {
  61 |     // Test the /out/ route directly with a known store
  62 |     const response = await page.goto('/out/1/test-game');
  63 |     // Should redirect (302) or 404 if game not found
  64 |     // The important thing: no 500 error
  65 |     expect(response?.status()).toBeLessThan(500);
  66 |   });
  67 |
  68 |   test('home page has essential elements', async ({ page }) => {
  69 |     await page.goto('/');
> 70 |     await expect(page).toHaveTitle(/GameDeals|game.deals/i);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  71 |     await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
  72 |   });
  73 | });
  74 |
```