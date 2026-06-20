import type { Page } from '@playwright/test';

export function hasAuthCredentials(): boolean {
  return !!(process.env.TEST_SUPABASE_USER_EMAIL && process.env.TEST_SUPABASE_USER_PASSWORD);
}

export async function signInAsTestUser(page: Page): Promise<void> {
  const email = process.env.TEST_SUPABASE_USER_EMAIL;
  const password = process.env.TEST_SUPABASE_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E auth credentials not configured');
  }

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1_000);

  const signInButton = page.getByRole('button', { name: /sign in|entrar|login/i });
  if (await signInButton.isVisible()) {
    await signInButton.click();
    await page.waitForTimeout(500);
  }

  const emailInput = page.getByRole('textbox', { name: /email/i });
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
    const passwordInput = page.getByRole('textbox', { name: /password|senha/i });
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(password);
    }
    const submitButton = page.getByRole('button', { name: /sign in|entrar|submit|continuar/i });
    await submitButton.click();
    await page.waitForTimeout(3_000);
  }
}
