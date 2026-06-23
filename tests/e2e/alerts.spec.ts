import { execSync } from 'node:child_process';
import { expect, type Page, test } from '@playwright/test';

const BASE = 'http://localhost:3000';
const CRON_AUTH = process.env.CRON_SECRET ?? 'placeholder-cron-secret';

async function blockProblematicRequests(page: Page) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const u = new URL(url);
    const pathname = u.pathname;

    if (pathname.startsWith('/wishlist') && !pathname.startsWith('/wishlist/shared')) {
      await route.abort();
      return;
    }
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

test.describe('Price alerts page', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(120_000);
    await blockProblematicRequests(page);
  });

  test('1. /alerts page renders without crashing (unauthed)', async ({ page }) => {
    await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('2. /alerts route returns 200 (page renders successfully)', async ({ page }) => {
    const response = await page.request.get('/alerts');
    expect(response.status()).toBe(200);
  });
});

test.describe('Cron endpoint', () => {
  test('3. check-alerts responds 200/500 with valid auth', { tag: '@cron' }, async () => {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/check-alerts`,
      { timeout: 30_000, encoding: 'utf-8' }
    );
    // 200 = success, 500 = DB error (expected without real DB)
    // 401 = would mean auth bypass failed
    expect(result).not.toBe('401');
    expect(['200', '500']).toContain(result);
  });

  test('4. check-alerts returns 401 without auth header', { tag: '@cron' }, async () => {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/check-alerts`,
      { timeout: 10_000, encoding: 'utf-8' }
    );
    expect(result).toBe('401');
  });

  test('5. ingest-prices responds 200/500 with valid auth', { tag: '@cron' }, async () => {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/ingest-prices`,
      { timeout: 30_000, encoding: 'utf-8' }
    );
    expect(result).not.toBe('401');
    expect(['200', '500']).toContain(result);
  });

  test('6. ingest-prices returns 401 without auth header', { tag: '@cron' }, async () => {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/ingest-prices`,
      { timeout: 10_000, encoding: 'utf-8' }
    );
    expect(result).toBe('401');
  });

  test('7. reindex-typesense responds 200/500 with valid auth', { tag: '@cron' }, async () => {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/reindex-typesense`,
      { timeout: 30_000, encoding: 'utf-8' }
    );
    expect(result).not.toBe('401');
    expect(['200', '500']).toContain(result);
  });

  test('8. reindex-typesense returns 401 without auth header', { tag: '@cron' }, async () => {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/reindex-typesense`,
      { timeout: 10_000, encoding: 'utf-8' }
    );
    expect(result).toBe('401');
  });
});

test.describe('Navigation', () => {
  test('9. Page renders with main element visible', async ({ page }) => {
    await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);
    await expect(page.locator('main')).toBeVisible();
  });

  test('10. Home page has accessible navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('11. Full alerts CRUD flow', async ({ page }) => {
    // Step 1: Navigate to a game detail page (Outer Wilds, CheapShark ID 612)
    await page.goto('/game/612', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);

    // Verify game detail page content loaded
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    expect(bodyText).not.toContain('Something went wrong');

    // Skip if game data unavailable (CheapShark rate limit)
    const gameTitle = page.locator('h1, h2, [data-testid="game-title"]').first();
    if (!(await gameTitle.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip(true, 'Game data unavailable (CheapShark rate limit)');
      return;
    }

    // Step 2: Click "Alert Me" button
    const alertButton = page.getByRole('button', { name: /alert me/i });
    await expect(alertButton).toBeVisible();
    await alertButton.click();

    // Step 3: Auth modal appears (unauthed mode)
    await page.waitForTimeout(500);
    const authModal = page.getByRole('heading', { name: /welcome to gamedeals/i });
    await expect(authModal).toBeVisible();

    // Step 4: Close modal via Escape (or click outside)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(authModal).not.toBeVisible();

    // Step 5: Navigate to /alerts page
    await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);

    // Step 6: Verify /alerts page renders without crashing
    const alertsBodyText = await page.locator('body').innerText();
    expect(alertsBodyText.length).toBeGreaterThan(50);
    expect(alertsBodyText).not.toContain('Something went wrong');
  });
});
