# Task 5: Profile page — kill the 404

**Status**: PASS  
**SHA**: c459f0c  
**Tests**: 2/2 passed (authenticated render + redirect)  
**Build**: `pnpm build` succeeds, `/profile` route listed  
**Files created**:
- `src/app/profile/page.tsx` — async server component, displays email/provider/member-since
- `src/app/profile/__tests__/page.test.tsx` — Vitest, mocks supabase and next/navigation

**Concerns**: None.
