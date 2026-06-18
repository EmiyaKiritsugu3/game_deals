import type { Page } from '@playwright/test';

export async function signInAsTestUser(page: Page): Promise<void> {
  const email = process.env.TEST_SUPABASE_USER_EMAIL;
  const password = process.env.TEST_SUPABASE_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing E2E auth credentials. Set TEST_SUPABASE_USER_EMAIL and TEST_SUPABASE_USER_PASSWORD env vars.'
    );
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
