import { expect, test } from '@playwright/test';

const LONG_TIMEOUT = 90_000;

test.describe('Visual regression', () => {
  test.beforeEach(({ page }) => {
    test.setTimeout(LONG_TIMEOUT);
    page.setDefaultTimeout(LONG_TIMEOUT);
  });

  test('1. Home page renders correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForSelector('main, #__next, [data-testid="deals-grid"]', { timeout: 30000 });
    await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  });

  test('2. Search results page renders correctly', async ({ page }) => {
    await page.goto('/search?q=zelda', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  });

  test('3. Shared wishlist page renders correctly', async ({ page }) => {
    await page.goto('/wishlist/shared?ids=', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  });

  test('4. Game detail page renders correctly', async ({ page }) => {
    await page.goto('/game/1', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  });

  test('5. Auth modal opens correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const loginButton = page.locator(
      '[data-testid="login-button"], [role="button"][aria-label="Login"], button:has-text("Entrar")'
    );
    if (await loginButton.isVisible({ timeout: 8000 }).catch(() => false)) {
      await loginButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
    }
  });

  test('6. Price alert modal opens from game page', async ({ page }) => {
    await page.goto('/game/1', { waitUntil: 'load' });
    const alertButton = page.locator(
      '[data-testid="price-alert-button"], button:has-text("Alert")'
    );
    if (await alertButton.isVisible({ timeout: 8000 }).catch(() => false)) {
      await alertButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
    }
  });
});
