# Implementation Plan - Strict Historical Lows Verification

The user requested that the "Historical Lows" section contains **only** games currently at their all-time lowest price. Since the bulk list API doesn't provide this flag, we will implement a server-side verification layer.

## Proposed Changes

### [Component] Home Page (src/app/page.tsx)

#### [MODIFY] [page.tsx](file:///home/emiyakiritsugu/Projetos_Antigravity/game-deals/src/app/page.tsx)
- Increase the candidate pool for Historical Lows by fetching 30-50 deals.
- Implement a verification loop that:
    1. Takes the top 15 potential HL deals.
    2. Fetches their full metadata using `getGame(id)` in parallel.
    3. Filters out any game where `bestCurrentPrice > historicalLowPrice`.
    4. Limits the final display to 8 verified deals.

## Verification Plan

### Manual Verification
1. Run the project locally.
2. Observe the "Historical Lows" section.
3. Click on a few deals in that section.
4. Verify in the Sidebar Modal that the "LIVE HL" badge is present or the price matches the "Historical Low" value shown in the stats.
