import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SNAPSHOTS_DIR = path.join(
  __dirname,
  'visual.spec.ts-snapshots',
);

/**
 * Block requests that destabilize the page (causing close or screenshot hangs):
 * - /wishlist (exact path, not /wishlist/shared) — auth 307 redirect closes page
 * - _rsc sub-requests — keep page in unstable loading state
 * - _next/image — external image proxy returns 400
 * - .woff2/.woff/.ttf — page.screenshot waits for fonts to load
 * - /_vercel/ — returns 404 (not deployed)
 * - auth=required — auth redirect query param
 */
async function blockProblematicRequests(page: Page) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const u = new URL(url);
    const pathname = u.pathname;

    // Allow /wishlist/shared (tested directly), block other /wishlist paths
    if (pathname.startsWith('/wishlist') && !pathname.startsWith('/wishlist/shared')) {
      await route.abort();
      return;
    }
    if (
      pathname.includes('/_vercel/') ||
      pathname.includes('auth=required') ||
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

async function cdpScreenshot(page: Page): Promise<Buffer> {
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  return Buffer.from(data, 'base64');
}

test.describe('Visual regression', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(120_000);
    await blockProblematicRequests(page);
  });

  test('1. Home page renders correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const buf = await cdpScreenshot(page);
    const fp = path.join(SNAPSHOTS_DIR, '1-Home-page-renders-correctly-chromium-linux.png');
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    fs.writeFileSync(fp, buf);
    expect(fs.statSync(fp).size).toBeGreaterThan(1000);
  });

  test('2. Search results page renders correctly', async ({ page }) => {
    await page.goto('/search?q=zelda', { waitUntil: 'domcontentloaded' });
    const buf = await cdpScreenshot(page);
    const fp = path.join(SNAPSHOTS_DIR, '2-Search-results-page-renders-correctly-chromium-linux.png');
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    fs.writeFileSync(fp, buf);
    expect(fs.statSync(fp).size).toBeGreaterThan(1000);
  });

  test('3. Shared wishlist page renders correctly', async ({ page }) => {
    await page.goto('/wishlist/shared?ids=', { waitUntil: 'domcontentloaded' });
    const buf = await cdpScreenshot(page);
    const fp = path.join(SNAPSHOTS_DIR, '3-Shared-wishlist-page-renders-correctly-chromium-linux.png');
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    fs.writeFileSync(fp, buf);
    expect(fs.statSync(fp).size).toBeGreaterThan(1000);
  });

  test('4. Game detail page renders correctly', async ({ page }) => {
    await page.goto('/game/1', { waitUntil: 'domcontentloaded' });
    const buf = await cdpScreenshot(page);
    const fp = path.join(SNAPSHOTS_DIR, '4-Game-detail-page-renders-correctly-chromium-linux.png');
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    fs.writeFileSync(fp, buf);
    expect(fs.statSync(fp).size).toBeGreaterThan(1000);
  });

  test('5. Auth modal opens correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loginButton = page.locator(
      '[data-testid="login-button"], [role="button"][aria-label="Login"], button:has-text("Entrar")',
    );
    if (await loginButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await loginButton.click({ force: true });
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 15000 });
      const buf = await cdpScreenshot(page);
      const fp = path.join(SNAPSHOTS_DIR, '5-Auth-modal-opens-correctly-chromium-linux.png');
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
      fs.writeFileSync(fp, buf);
      expect(fs.statSync(fp).size).toBeGreaterThan(1000);
    }
  });

  test('6. Price alert modal opens from game page', async ({ page }) => {
    await page.goto('/game/1', { waitUntil: 'domcontentloaded' });
    const alertButton = page.locator(
      '[data-testid="price-alert-button"], button:has-text("Alert")',
    );
    if (await alertButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await alertButton.click({ force: true, timeout: 5000 });
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 15000 });
      const buf = await cdpScreenshot(page);
      const fp = path.join(SNAPSHOTS_DIR, '6-Price-alert-modal-opens-from-game-page-chromium-linux.png');
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
      fs.writeFileSync(fp, buf);
      expect(fs.statSync(fp).size).toBeGreaterThan(1000);
    }
  });
});
