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

## 2024-10-24 - [Avoid Array Allocation and Sequential Iteration on large datasets]
**Learning:** Found a pattern calculating `avgSavings` and `topDiscount` using `.reduce()` and `Math.max(...list.map(...))` sequentially. This pattern causes O(N) memory allocation to map the array and another O(N) memory allocation to spread the mapped array as arguments to `Math.max()`. This spreads a large array, potentially exceeding the JavaScript engine's call stack size, and the multiple iterations cause measurable CPU time overhead.
**Action:** Replaced sequential array map/reduce operations with a single-pass `for...of` loop to calculate both statistics simultaneously. This eliminates unnecessary array duplication overhead and achieves O(1) space complexity while requiring only a single iteration.
