## 2024-06-23 - Fast Unicode-Safe Hashing
**Learning:** Using `Array.from(str).reduce(...)` to compute hashes correctly handles Unicode surrogate pairs but allocates an O(n) array, slowing down string processing (about ~6.5x slower in benchmarks).
**Action:** Use a `for...of` loop which handles Unicode correctly but avoids array allocation. Example: `let hash = 0; for (const char of str) { hash += char.codePointAt(0) ?? 0; }`.
