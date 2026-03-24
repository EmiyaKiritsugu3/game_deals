from playwright.sync_api import sync_playwright
import os

verification_dir = "/home/jules/verification"
os.makedirs(os.path.join(verification_dir, "video"), exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(record_video_dir=os.path.join(verification_dir, "video"), viewport={"width": 1280, "height": 800})
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")
        page.wait_for_timeout(4000)

        # Let the carousel auto-play and record its behavior
        page.screenshot(path=os.path.join(verification_dir, "hero_3d_z_index_fix.png"))

        # Take an additional screenshot for safety
        page.wait_for_timeout(2000)
    finally:
        context.close()
        browser.close()
