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
    command: 'bun --bun next build && bun --bun next start',
    port: 3000,
    timeout: 300_000,
    reuseExistingServer: true,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://localhost:5432/gamedeals_test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'test',
      CRON_SECRET: process.env.CRON_SECRET || 'placeholder-cron-secret',
    },
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://localhost:5432/gamedeals_test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'test',
      CRON_SECRET: process.env.CRON_SECRET || 'placeholder-cron-secret',
    },
  },
});
