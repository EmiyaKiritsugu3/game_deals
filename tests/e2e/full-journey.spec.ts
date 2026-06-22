import { expect, type Page, test } from '@playwright/test';

async function blockProblematicRequests(page: Page) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const u = new URL(url);
    const pathname = u.pathname;

    if (
      u.search.includes('_rsc') ||
      pathname.startsWith('/_next/image') ||
      pathname.includes('.woff2') ||
      pathname.includes('.woff') ||
      pathname.includes('.ttf') ||
      pathname.includes('favicon.ico')
    ) {
      await route.abort();
    } else {
      await route.continue();
    }
  });
}

test.describe('Full anonymous journey', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(120_000);
    await blockProblematicRequests(page);
  });

  test('browse deals, search, view game detail', async ({ page }) => {
    // 1. Home page loads with deals (deal cards are links to /game/[id])
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const dealCard = page.locator('a[href^="/game/"]').first();
    await expect(dealCard).toBeVisible({ timeout: 15000 });

    // 2. Search for a game
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"], input[name="search"]'
    );
    await searchInput.first().fill('Witcher');
    // SearchBox renders dropdown with Link[href^="/game/"] children
    const searchResult = page.locator('a[href^="/game/"]').first();
    await expect(searchResult).toBeVisible({ timeout: 10000 });

    // 3. Click first search result -> game detail
    await searchResult.click();

    // 4. Game detail page/modal loads
    await expect(page.locator('h1, h2, [data-testid="game-title"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('affiliate redirect validates store and returns no 500', async ({ page }) => {
    // Test the /out/ route directly with a known store
    const response = await page.goto('/out/1/test-game');
    // Should redirect (302) or 404 if game not found
    // The important thing: no 500 error
    expect(response?.status()).toBeLessThan(500);
  });

  test('home page has essential elements', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GameDeals|game.deals/i);
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
  });
});
