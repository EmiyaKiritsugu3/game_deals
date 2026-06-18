# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alerts.spec.ts >> Cron endpoint >> 3. check-alerts responds 200/500 with valid auth
- Location: tests/e2e/alerts.spec.ts:54:7

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
  60  |     // 401 = would mean auth bypass failed
> 61  |     expect(result).not.toBe('401');
      |                        ^ Error: expect(received).not.toBe(expected) // Object.is equality
  62  |     expect(['200', '500']).toContain(result);
  63  |   });
  64  | 
  65  |   test('4. check-alerts returns 401 without auth header', { tag: '@cron' }, async () => {
  66  |     const result = execSync(
  67  |       `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/check-alerts`,
  68  |       { timeout: 10_000, encoding: 'utf-8' }
  69  |     );
  70  |     expect(result).toBe('401');
  71  |   });
  72  | 
  73  |   test('5. ingest-prices responds 200/500 with valid auth', { tag: '@cron' }, async () => {
  74  |     const result = execSync(
  75  |       `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/ingest-prices`,
  76  |       { timeout: 30_000, encoding: 'utf-8' }
  77  |     );
  78  |     expect(result).not.toBe('401');
  79  |     expect(['200', '500']).toContain(result);
  80  |   });
  81  | 
  82  |   test('6. ingest-prices returns 401 without auth header', { tag: '@cron' }, async () => {
  83  |     const result = execSync(
  84  |       `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/ingest-prices`,
  85  |       { timeout: 10_000, encoding: 'utf-8' }
  86  |     );
  87  |     expect(result).toBe('401');
  88  |   });
  89  | 
  90  |   test('7. reindex-typesense responds 200/500 with valid auth', { tag: '@cron' }, async () => {
  91  |     const result = execSync(
  92  |       `curl -s -o /dev/null -w "%{http_code}" -H "authorization: Bearer ${CRON_AUTH}" ${BASE}/api/cron/reindex-typesense`,
  93  |       { timeout: 30_000, encoding: 'utf-8' }
  94  |     );
  95  |     expect(result).not.toBe('401');
  96  |     expect(['200', '500']).toContain(result);
  97  |   });
  98  | 
  99  |   test('8. reindex-typesense returns 401 without auth header', { tag: '@cron' }, async () => {
  100 |     const result = execSync(
  101 |       `curl -s -o /dev/null -w "%{http_code}" ${BASE}/api/cron/reindex-typesense`,
  102 |       { timeout: 10_000, encoding: 'utf-8' }
  103 |     );
  104 |     expect(result).toBe('401');
  105 |   });
  106 | });
  107 | 
  108 | test.describe('Navigation', () => {
  109 |   test('9. Page renders with main element visible', async ({ page }) => {
  110 |     await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
  111 |     await page.waitForTimeout(1_500);
  112 |     await expect(page.locator('main')).toBeVisible();
  113 |   });
  114 | 
  115 |   test('10. Home page has accessible navigation', async ({ page }) => {
  116 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  117 |     await page.waitForTimeout(1_500);
  118 |     const bodyText = await page.locator('body').innerText();
  119 |     expect(bodyText.length).toBeGreaterThan(50);
  120 |   });
  121 | 
  122 |   test('11. Full alerts CRUD flow', async ({ page }) => {
  123 |     // Step 1: Navigate to a game detail page (Outer Wilds, CheapShark ID 612)
  124 |     await page.goto('/game/612', { waitUntil: 'domcontentloaded' });
  125 |     await page.waitForTimeout(2_000);
  126 | 
  127 |     // Verify game detail page content loaded
  128 |     const bodyText = await page.locator('body').innerText();
  129 |     expect(bodyText.length).toBeGreaterThan(50);
  130 |     expect(bodyText).not.toContain('Something went wrong');
  131 | 
  132 |     // Step 2: Click "Alert Me" button
  133 |     const alertButton = page.getByRole('button', { name: /alert me/i });
  134 |     await expect(alertButton).toBeVisible();
  135 |     await alertButton.click();
  136 | 
  137 |     // Step 3: Auth modal appears (unauthed mode)
  138 |     await page.waitForTimeout(500);
  139 |     const authModal = page.getByRole('heading', { name: /welcome to gamedeals/i });
  140 |     await expect(authModal).toBeVisible();
  141 | 
  142 |     // Step 4: Close modal via Escape (or click outside)
  143 |     await page.keyboard.press('Escape');
  144 |     await page.waitForTimeout(500);
  145 |     await expect(authModal).not.toBeVisible();
  146 | 
  147 |     // Step 5: Navigate to /alerts page
  148 |     await page.goto('/alerts', { waitUntil: 'domcontentloaded' });
  149 |     await page.waitForTimeout(1_500);
  150 | 
  151 |     // Step 6: Verify /alerts page renders without crashing
  152 |     const alertsBodyText = await page.locator('body').innerText();
  153 |     expect(alertsBodyText.length).toBeGreaterThan(50);
  154 |     expect(alertsBodyText).not.toContain('Something went wrong');
  155 |   });
  156 | });
  157 | 
```