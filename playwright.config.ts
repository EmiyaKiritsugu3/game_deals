import { defineConfig, devices } from '@playwright/test';

// Anti-aliasing tolerance: 100px is standard for visual regression.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially to avoid overwhelming the server
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Production mode for stable visuals (next dev can cause OOM per AGENTS.md)
  webServer: {
    command: 'pnpm build && pnpm start',
    port: 3000,
    timeout: 300_000,
    reuseExistingServer: true,
  },
});
