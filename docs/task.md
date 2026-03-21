# Game Deals Enhancements: More Stores & Better Hero

- [x] **Phase 1-3:** UI Harmonization (Dark Theme, Grid Alignment, Variables).
- [x] **Phase 4:** Game Details Sidebar via Next.js Intercepting Routes.

- [x] **Phase 5: API Expansion & Business Model (Affiliates)**
  - [x] Investigate alternative APIs (CheapShark blocks keyshops, ITAD requires auth).
  - [x] Update `api.ts` to generate realistic simulated Grey Market deals (CDKeys, Kinguin, Eneba) appended to real CheapShark data.
  - [x] Update the UI (specifically the Game Details Sidebar) to visually separate "Official Stores" vs "Keyshops", allowing users to compare the two markets identically to gg.deals.

- [x] **Phase 6: Hero Section Elevation**
  - [x] Analyze the current Hero section. It lacks the density of information and excitement seen on premium deal sites.
  - [x] Add more metadata to the Hero slide: Platforms (Windows, Mac, etc.), DRM types (Steam key, Epic key), Metacritic scores or Steam user ratings prominently.
  - [x] Improve the visual composition (maybe a split layout within the hero: 60% image/trailer, 40% dense offer details).

- [x] **Phase 7: Maintenance & Polish**
  - [x] Audit and update project dependencies (Next.js, React, Recharts) via `npm update` to ensure security and performance.

- [x] **Phase 8: Modern Stack Upgrade**
  - [x] **Icons (`lucide-react`):** Refactor raw SVGs across all components (Navbar, Hero, DealRow) to Lucide.
  - [x] **State (`zustand`):** Create global Wishlist store (persisted to localStorage) and attach it to Deals/Navbar.
  - [x] **Data (`swr`):** Implement real-time Search dropdown inside the Navbar utilizing CheapShark API.
  - [x] **Animations (`framer-motion`):** Upgrade routing and entrance animations (Hero slide interactions, Intercept Sidebar modal).

- [x] **Phase 9: Wishlist Elevation**
  - [x] **Empty State & Motion:** Create a premium zero-state design and stagger list entrance.
  - [x] **Dynamic Header:** Add a blurred glassmorphism banner reacting to the top saved game.
  - [x] **Stats Dashboard:** Introduce a summary panel (Total Value, Biggest Discount).
  - [x] **Filters & Sort:** Add controls to sort by Deal %, Price, or Name.

- [x] **Bugfixes Post-Release**
  - [x] **Historical Low Integrity:** Fixed `api.ts` so simulated Keyshop undercuts correctly trigger a new `cheapestPriceEver` floor, preventing `$1.00` historical lows acting superior to current `$0.71` keyshop deals.

- [x] **Branding Update**
  - [x] **Global Rename:** Rebrand all instances of GGDeals.BR to GameDeals.

- [x] **Phase 10: Monetization & Conversion Engine**
  - [x] **Affiliate Cloaking Gateway:** Create a `/out` redirect route to mask outbound links and inject affiliate tags.
  - [x] **Dynamic Price History Charts:** Replace the placeholder chart with a realistic 6-month historical curve using `Recharts`.
  - [x] **Value-for-Money UX:** Visually implement the Cheapshark `dealRating` parameter to drive click urgency.

- [x] **Phase 11: Engagement & Growth Features**
  - [x] **11a — DRM/Region Badges:** Show Steam/Epic/GOG DRM icon and 🇧🇷 region tag on deal rows.
  - [x] **11b — HLTB Cost-per-Hour:** Integrate HowLongToBeat data to show $/hour value metric.
  - [x] **11c — Bundles Aggregator:** New `/bundles` page tracking multi-game packs.
  - [x] **11d — Shareable Wishlist:** Generate public URLs for wishlists (`/wishlist/[slug]`).
  - [x] **11e — Curated Collections:** Editorial `/collections` page with themed game lists.
  - [x] **11f — Auth + Price Alerts:** Simulated login UI with local price threshold notifications.

- [x] **Phase 12: Production Readiness (Supabase & Vercel)**
  - [x] **12a — Project Setup:** Create `.env.example` and initialize Supabase client.
  - [x] **12b — Cloud Database:** Define PostgreSQL schema (Profiles, Alerts, Wishlists).
  - [x] **12c — Real Auth:** Replace simulation with Supabase Auth (Google/Discord).
  - [x] **12d — Sync Logic:** Move data from LocalStorage to Cloud on first login.
  - [x] **12e — Alert Worker:** Implement Vercel Cron Job for price checking.
  - [x] **12f — Affiliate Mapping:** Real outbound link transformation in `/out`.
  - [x] **12g — Launch:** Final build and Vercel Deployment.

- [x] **Phase 13: Jules Collaboration & Social Fixes**
    - [x] Resolve Git conflicts between Jules's social features and production stability fixes.
    - [x] Provide CSS Modules & Layout correction for overflow issues in `ActivityFeed`.
    - [x] Clarify project architecture (Vanilla CSS vs Tailwind) for Jules.
    - [x] Analyze Jules's work and provide definitive feedback.

- [x] **Phase 14: Analytics & Performance Monitoring**
    - [x] Install `@vercel/analytics` package.
    - [x] Integrate `<Analytics />` component in root `layout.tsx`.
    - [x] Verify local functionality.

- [x] **Phase 15: Vercel Clean Deployment**
    - [x] Generate `clean_deployment_guide.md` for manual user push.
    - [x] Delete old project on Vercel.
    - [x] Perform manual push from user terminal.
    - [x] Create new Vercel project with official Environment Variables.

- [x] **Phase 16: Final Performance & Architectural Refactor**
    - [x] Modularize `api.ts` into Types, Constants, and Utils.
    - [x] Implement `next/dynamic` for heavy chart components.
    - [x] Sync Sidebar Modal with Standalone feature parity.

- [x] **Phase 17: Security Hardening & Maintenance**
    - [x] Identify moderate severity vulnerabilities in Next.js (Request Smuggling, image cache growth).
    - [x] Perform `npm audit fix --force` to upgrade Next.js to `16.2.1` (Safe version).
    - [x] Verify total application stability post-upgrade.

- [x] **Phase 18: Home Page Modularization**
    - [x] Extract `HistoricalLows` logic into a dedicated Server Component.
    - [x] Extract `EndingSoon` logic into a dedicated Server Component.
    - [x] Refactor `page.tsx` to utilize the new modular components.

---

**GameDeals is stabilized, optimized, and secured!** 🚀🧹🛡️
