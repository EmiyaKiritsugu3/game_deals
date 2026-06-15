# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual.spec.ts >> Visual regression >> 2. Search results page renders correctly
- Location: tests/e2e/visual.spec.ts:17:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
TimeoutError: page.goto: Timeout 90000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/search?q=zelda", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const LONG_TIMEOUT = 90_000;
  4  | 
  5  | test.describe('Visual regression', () => {
  6  |   test.beforeEach(({ page }) => {
  7  |     test.setTimeout(LONG_TIMEOUT);
  8  |     page.setDefaultTimeout(LONG_TIMEOUT);
  9  |   });
  10 | 
  11 |   test('1. Home page renders correctly', async ({ page }) => {
  12 |     await page.goto('/', { waitUntil: 'load' });
  13 |     await page.waitForSelector('main, #__next, [data-testid="deals-grid"]', { timeout: 30000 });
  14 |     await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  15 |   });
  16 | 
  17 |   test('2. Search results page renders correctly', async ({ page }) => {
> 18 |     await page.goto('/search?q=zelda', { waitUntil: 'load' });
     |                ^ TimeoutError: page.goto: Timeout 90000ms exceeded.
  19 |     await page.waitForTimeout(2000);
  20 |     await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  21 |   });
  22 | 
  23 |   test('3. Shared wishlist page renders correctly', async ({ page }) => {
  24 |     await page.goto('/wishlist/shared?ids=', { waitUntil: 'load' });
  25 |     await page.waitForTimeout(2000);
  26 |     await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  27 |   });
  28 | 
  29 |   test('4. Game detail page renders correctly', async ({ page }) => {
  30 |     await page.goto('/game/1', { waitUntil: 'load' });
  31 |     await page.waitForTimeout(3000);
  32 |     await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  33 |   });
  34 | 
  35 |   test('5. Auth modal opens correctly', async ({ page }) => {
  36 |     await page.goto('/', { waitUntil: 'load' });
  37 |     const loginButton = page.locator(
  38 |       '[data-testid="login-button"], [role="button"][aria-label="Login"], button:has-text("Entrar")'
  39 |     );
  40 |     if (await loginButton.isVisible({ timeout: 8000 }).catch(() => false)) {
  41 |       await loginButton.click();
  42 |       await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 });
  43 |       await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  44 |     }
  45 |   });
  46 | 
  47 |   test('6. Price alert modal opens from game page', async ({ page }) => {
  48 |     await page.goto('/game/1', { waitUntil: 'load' });
  49 |     const alertButton = page.locator(
  50 |       '[data-testid="price-alert-button"], button:has-text("Alert")'
  51 |     );
  52 |     if (await alertButton.isVisible({ timeout: 8000 }).catch(() => false)) {
  53 |       await alertButton.click();
  54 |       await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 });
  55 |       await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' });
  56 |     }
  57 |   });
  58 | });
  59 | 
```