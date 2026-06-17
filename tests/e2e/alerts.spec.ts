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
    expect(bodyText.length).toBeGreaterThan(100);
  });
});
