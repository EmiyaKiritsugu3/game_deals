# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alerts.spec.ts >> Cron endpoint >> 5. ingest-prices responds 200/500 with valid auth
- Location: tests/e2e/alerts.spec.ts:74:7

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "401"
```

# Test source

```ts
  1   | import { execSync } from 'node:child_process';
  2   | import { expect, type Page, test } from '@playwright/test';
  3   | 
  4   | const BASE = 'http://localhost:3000';
  5   | const CRON_AUTH = process.env.CRON_SECRET ?? 'placeholder-cron-secret';
  6   | 
  7   | async function blockProblematicRequests(page: Page) {
  8   |   await page.route('**/*', async (route) => {
  9   |     const url = route.request().url();
  10  |     const u = new URL(url);
  11  |     const pathname = u.pathname;
  12  | 
  13  |     if (pathname.startsWith('/wishlist') && !pathname.startsWith('/wishlist/shared')) {
  14  |       await route.abort();
  15  |       return;
  16  |     }
  17  |     if (
  18  |       u.search.includes('_rsc') ||
  19  |       pathname.startsWith('/_next/image') ||
  20  |       pathname.includes('.woff2') ||
  21  |       pathname.includes('.woff') ||
  22  |       pathname.includes('.ttf') ||
  23  |       pathname.includes('favicon.ico')
  24  |     ) {
  25  |       await route.abort();
  26  |     } else {
  27  |       await route.continue();
  28  |     }
  29  |   });
  30  | }
  31  | 
  32  | test.describe('Price alerts page', () => {
  33  |   test.beforeEach(async ({ page }) => {
  34  |     test.setTimeout(120_000);
  35  |     page.setDefaultTimeout(120_000);
  36  |     await blockProblematicRequests(page);
  37  |   });
  38  | 
  39  |   test('1. /alerts page renders without crashing (unauthed)', async ({ page }) => {
  40  |     await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
  41  |     await page.waitForTimeout(1_000);
  42  |     const body = await page.locator('body').innerText();
  43  |     expect(body.length).toBeGreaterThan(50);
  44  |     expect(body).not.toContain('Something went wrong');
  45  |   });
  46  | 
  47  |   test('2. /alerts route returns 200 (page renders successfully)', async ({ page }) => {
  48  |     const response = await page.request.get('/alerts');
  49  |     expect(response.status()).toBe(200);
  50  |   });
  51  | });
  52  | 
  53  | test.describe('Cron endpoint', () => {
  54  |   test('3. check-alerts responds 200/500 with valid auth', { tag: '@cron' }, async () => {
  55  |     const result = execSync(
  56  |       `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/check-alerts`,
  57  |       { timeout: 30_000, encoding: 'utf-8' }
  58  |     );
  59  |     // 200 = success, 500 = DB error (expected without real DB)
  60  |     // 429 = cheapshark rate limit (still valid auth)
  61  |     // 401 = would mean auth bypass failed
  62  |     expect(result).not.toBe('401');
  63  |     expect(['200', '429', '500']).toContain(result);
  64  |   });
  65  |
  66  |   test('4. check-alerts returns 401 without auth header', { tag: '@cron' }, async () => {
  67  |     const result = execSync(
  68  |       `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/check-alerts`,
  69  |       { timeout: 10_000, encoding: 'utf-8' }
  70  |     );
  71  |     expect(result).toBe('401');
  72  |   });
  73  |
  74  |   test('5. ingest-prices responds 200/500 with valid auth', { tag: '@cron' }, async () => {
  75  |     const result = execSync(
  76  |       `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/ingest-prices`,
  77  |       { timeout: 30_000, encoding: 'utf-8' }
  78  |     );
> 79  |     expect(result).not.toBe('401');
      |                        ^ Error: expect(received).not.toBe(expected) // Object.is equality
  80  |     expect(['200', '429', '500']).toContain(result);
  81  |   });
  82  |
  83  |   test('6. ingest-prices returns 401 without auth header', { tag: '@cron' }, async () => {
  84  |     const result = execSync(
  85  |       `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/ingest-prices`,
  86  |       { timeout: 10_000, encoding: 'utf-8' }
  87  |     );
  88  |     expect(result).toBe('401');
  89  |   });
  90  |
  91  |   test('7. reindex-typesense responds 200/500 with valid auth', { tag: '@cron' }, async () => {
  92  |     const result = execSync(
  93  |       `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/reindex-typesense`,
  94  |       { timeout: 30_000, encoding: 'utf-8' }
  95  |     );
  96  |     expect(result).not.toBe('401');
  97  |     expect(['200', '429', '500']).toContain(result);
  98  |   });
  99  |
  100 |   test('8. reindex-typesense returns 401 without auth header', { tag: '@cron' }, async () => {
  101 |     const result = execSync(
  102 |       `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/reindex-typesense`,
  103 |       { timeout: 10_000, encoding: 'utf-8' }
  104 |     );
  105 |     expect(result).toBe('401');
  106 |   });
  107 | });
  108 |
  109 | test.describe('Navigation', () => {
  110 |   test('9. Page renders with main element visible', async ({ page }) => {
  111 |     await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
  112 |     await page.waitForTimeout(1_500);
  113 |     await expect(page.locator('main').first()).toBeVisible();
  114 |   });
  115 |
  116 |   test('10. Home page has accessible navigation', async ({ page }) => {
  117 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  118 |     await page.waitForTimeout(1_500);
  119 |     const bodyText = await page.locator('body').innerText();
  120 |     expect(bodyText.length).toBeGreaterThan(50);
  121 |   });
  122 |
  123 |   test('11. Full alerts CRUD flow', async ({ page }) => {
  124 |     // Step 1: Navigate to a game detail page (Outer Wilds, CheapShark ID 612)
  125 |     await page.goto('/game/612', { waitUntil: 'domcontentloaded' });
  126 |     await page.waitForTimeout(2_000);
  127 |
  128 |     // Verify game detail page content loaded
  129 |     const bodyText = await page.locator('body').innerText();
  130 |     expect(bodyText.length).toBeGreaterThan(50);
  131 |     expect(bodyText).not.toContain('Something went wrong');
  132 |
  133 |     // Skip if game data unavailable (CheapShark rate limit)
  134 |     const gameTitle = page.locator('h1, h2, [data-testid="game-title"]').first();
  135 |     if (!(await gameTitle.isVisible({ timeout: 10000 }).catch(() => false))) {
  136 |       test.skip(true, 'Game data unavailable (CheapShark rate limit)');
  137 |       return;
  138 |     }
  139 |
  140 |     // Step 2: Click "Alert Me" button
  141 |     const alertButton = page.getByRole('button', { name: /alert me/i });
  142 |     await expect(alertButton).toBeVisible();
  143 |     await alertButton.click();
  144 |
  145 |     // Step 3: Auth modal appears (unauthed mode)
  146 |     await page.waitForTimeout(500);
  147 |     const authModal = page.getByRole('heading', { name: /welcome to gamedeals/i });
  148 |     await expect(authModal).toBeVisible();
  149 |
  150 |     // Step 4: Close modal via Escape (or click outside)
  151 |     await page.keyboard.press('Escape');
  152 |     await page.waitForTimeout(500);
  153 |     await expect(authModal).not.toBeVisible();
  154 |
  155 |     // Step 5: Navigate to /alerts page
  156 |     await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
  157 |     await page.waitForTimeout(1_500);
  158 |
  159 |     // Step 6: Verify /alerts page renders without crashing
  160 |     const alertsBodyText = await page.locator('body').innerText();
  161 |     expect(alertsBodyText.length).toBeGreaterThan(50);
  162 |     expect(alertsBodyText).not.toContain('Something went wrong');
  163 |   });
  164 | });
  165 |
```