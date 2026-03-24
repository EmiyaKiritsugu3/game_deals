import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Record video of the game details page with the chart
        context = await browser.new_context(record_video_dir="/home/jules/verification/video_game_chart")
        page = await context.new_page()

        # Hardcoding the Portal 2 GameID (61 for CheapShark)
        print("Navigating to http://localhost:3000/game/61...")
        await page.goto("http://localhost:3000/game/61", wait_until="networkidle")

        # Wait a bit for the Recharts SVG to render
        await page.wait_for_timeout(3000)

        # Scroll down slightly to make sure the chart is perfectly in view
        await page.evaluate("window.scrollBy(0, 400)")
        await page.wait_for_timeout(1000)

        print("Taking screenshot of the Game Chart...")
        await page.screenshot(path="/home/jules/verification/game_chart.png", full_page=False)

        # Try to hover over the chart to trigger the tooltip
        try:
            # Recharts usually renders the area in SVG elements
            chart_container = page.locator(".recharts-wrapper")
            await chart_container.hover()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="/home/jules/verification/game_chart_tooltip.png", full_page=False)
        except Exception as e:
            print("Could not trigger hover:", e)

        await context.close()
        await browser.close()
        print("Done. Video and screenshots saved to /home/jules/verification/")

asyncio.run(run())
