## 2024-06-22 - Server Component Memoization
**Learning:** Next.js `fetch` deduplication only prevents duplicate network requests within a server render pass, but it does NOT cache the subsequent response parsing (e.g. `res.json()`) or data transformations. In high-density pages (like lists of GameCards), mapping functions like `getStores()` that construct objects from arrays are re-executed for every component, causing unnecessary CPU load.
**Action:** Use React's `cache()` from `react` to wrap internal data-fetching/mapping utilities in Server Components. This memoizes the entire function execution (including parsing and mapping) per request, reducing CPU overhead and slightly improving TTFB.

## 2026-06-24 - Batched API Requests Resolve N+1 Problem
**Learning:** Using Promise.all with individual API endpoint calls inside a server component causes N+1 queries. CheapShark supports `?ids=`.
**Action:** Replaced 50 individual getGame requests with 2 getGamesBatch chunks, heavily reducing page load time and rate limits.

## 2026-06-26 - O(N log N) Sorting for Minimum Value Anti-pattern
**Learning:** Using `[...arr].sort()[0]` to find the minimum value in an array is a common anti-pattern that introduces O(N log N) time complexity and O(N) memory allocations for a problem that can be solved in O(N) time with O(1) space via simple iteration. In high-frequency background jobs or batch data processing loops (e.g., enriching deals or calculating historical lows for many games at once), this overhead accumulates quickly.
**Action:** Replace `sort()[0]` with a single `for` loop that iterates over the array to find the minimum value (or object containing the minimum value), significantly reducing CPU time and Garbage Collector pressure during batch operations.