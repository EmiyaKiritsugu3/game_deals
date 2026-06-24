# Task D3: Navbar Leaderboard Link

## Context
Spec: docs/superpowers/specs/2026-06-23-sprint-15-p2-gamification-design.md §5.3
Leaderboard page created at `/leaderboard` (D2)

## Requirements

Add Leaderboard link to Navbar component.

### File
`src/components/navbar/Navbar.tsx` (or wherever the main nav is defined — check actual file location)

### Location
Add near existing navigation links. Use `Trophy` icon from lucide-react.
- Authenticated users view
- Same styling as other nav links
- Label: "Leaderboard"
- Icon: Trophy size={20}

### Check existing link pattern
Look at how Wishlist or Profile links are rendered and match pattern.

## Verification
- `pnpm lint`
- `pnpm exec tsc --noEmit`
