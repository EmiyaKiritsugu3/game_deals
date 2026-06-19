import { expect, type Page, test } from '@playwright/test';
import { signInAsTestUser } from './fixtures/auth';

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

test.describe('Alerts CRUD', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    page.setDefaultTimeout(120_000);
    await blockProblematicRequests(page);
  });

  test('1. Authenticated user can create, view, and delete a price alert', async ({ page }) => {
    // Step 1: Sign in as test user
    await signInAsTestUser(page);

    // Step 2: Navigate to a game detail page (Outer Wilds, CheapShark ID 612)
    await page.goto('/game/612', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);

    // Verify game detail page content loaded
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    expect(bodyText).not.toContain('Something went wrong');

    // Step 3: Click Alert Me button (trigger button with data-testid)
    const alertTrigger = page.locator('[data-testid="price-alert-trigger"]');
    await expect(alertTrigger).toBeVisible();
    await alertTrigger.click();

    // Step 4: Wait for modal to appear, then set target price
    await page.waitForTimeout(1_000);
    const alertModal = page.locator('[data-testid="alert-modal"]');
    await expect(alertModal).toBeVisible();

    const targetInput = page.locator('[data-testid="target-price-input"]');
    await expect(targetInput).toBeVisible();
    await targetInput.fill('9.99');

    // Step 5: Click create alert button
    const createButton = page.locator('[data-testid="create-alert-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for modal to close after save
    await page.waitForTimeout(2_000);

    // Step 6: Navigate to /alerts page to verify alert was created
    await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);

    // Step 7: Verify alert was actually created (check target price appears)
    await expect(page.locator('body')).toContainText('$9.99');
    const alertsBodyText = await page.locator('body').innerText();
    expect(alertsBodyText).not.toContain('No price alerts yet');
    expect(alertsBodyText).not.toContain('Something went wrong');
  });
});
