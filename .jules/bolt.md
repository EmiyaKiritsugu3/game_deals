## 2024-06-22 - Server Component Memoization
**Learning:** Next.js `fetch` deduplication only prevents duplicate network requests within a server render pass, but it does NOT cache the subsequent response parsing (e.g. `res.json()`) or data transformations. In high-density pages (like lists of GameCards), mapping functions like `getStores()` that construct objects from arrays are re-executed for every component, causing unnecessary CPU load.
**Action:** Use React's `cache()` from `react` to wrap internal data-fetching/mapping utilities in Server Components. This memoizes the entire function execution (including parsing and mapping) per request, reducing CPU overhead and slightly improving TTFB.

## 2026-06-24 - Batched API Requests Resolve N+1 Problem
**Learning:** Using Promise.all with individual API endpoint calls inside a server component causes N+1 queries. CheapShark supports `?ids=`.
**Action:** Replaced 50 individual getGame requests with 2 getGamesBatch chunks, heavily reducing page load time and rate limits.
## 2024-06-27 - [Avoid Array Allocation in Find Minimum]
**Learning:** Found an unnecessary `[...arr].sort()[0]` pattern used to find the minimum price object in `updateHistoricalLow`. While finding a minimum via sorting takes O(N log N), the array spreading `[...arr]` also incurs an O(N) memory allocation overhead which can trigger garbage collection more frequently, especially in server-side batch operations like fetching 25 game deals.
**Action:** Always replace sorting-for-minimum patterns with a single-pass O(N) `for` loop to eliminate array spreading overhead and achieve O(1) space complexity.

## 2024-10-18 - [Optimizing batch processing by avoiding Array sorts]
**Learning:** For functions processing many deals or iterating over large collections of prices, using `[...arr].sort(...)[0]` incurs O(N log N) time complexity plus unnecessary O(N) memory allocations per iteration. In server-side batch operations (like `fetchGamesBatchFromCheapShark` or iterating over saved wishlists), this adds up to measurable CPU time overhead.
**Action:** Implemented a single-pass O(N) iteration helper (`getCheapestDeal`) to replace sort-based minimum finding. Always favor linear search over array duplication and sorting when extracting min/max values.

## 2024-11-20 - [Batching Multiple Promise.all]
**Learning:** Found sequential `await Promise.all()` calls used for independent groups of API requests. While each `Promise.all()` parallelized its internal tasks, the groups themselves were executed sequentially (an async waterfall), needlessly increasing server blocking time.
**Action:** Always batch independent `Promise.all` blocks into a single top-level `Promise.all([Promise.all(...), Promise.all(...)])` to ensure maximum concurrency across all groups of tasks.
