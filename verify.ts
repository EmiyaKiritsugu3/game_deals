import { sync_playwright } from 'playwright';
import os from 'os';
import path from 'path';

const verificationDir = path.join(os.homedir(), 'verification');

async function verify() {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ recordVideo: { dir: path.join(verificationDir, 'video') } });
  const page = await context.newPage();

  try {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Screenshot Hero
    await page.screenshot({ path: path.join(verificationDir, 'hero.png') });

    // Navigate to /user
    await page.goto('http://localhost:3000/user');
    await page.waitForTimeout(2000);

    // Screenshot User Profile
    await page.screenshot({ path: path.join(verificationDir, 'user_profile.png') });
  } finally {
    await context.close();
    await browser.close();
  }
}

// Since I wrote this in TS but didn't run with ts-node, let me rewrite in python as per instructions.