import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})

        # Navigate to the home page where Hero Section is presumably located
        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle")

        # Wait a bit for the auto-play and matrix drift animations to settle in
        await page.wait_for_timeout(3000)

        print("Taking screenshot of the Hero Section...")
        await page.screenshot(path="/home/jules/verification/hero_section.png", full_page=False)

        await browser.close()
        print("Done. Screenshot saved to /home/jules/verification/hero_section.png")

asyncio.run(run())
