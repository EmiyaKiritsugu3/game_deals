# Task Fix-2: Pin Vercel pnpm version

**Context:** Vercel uses its own pnpm version, not necessarily matching `package.json`'s `"packageManager": "pnpm@11.8.0"`. Lockfile was just regenerated with pnpm 11.8.0. Vercel has historically used pnpm 9.x, which can't parse lockfile v9.0.

**Work directory:** /home/emiyakiritsugu/Projetos_Antigravity/game-deals

## Requirements

1. Check `npx vercel project ls` and `npx vercel inspect` for current pnpm version setting
2. Add `"buildCommand"` and `"installCommand"` to `vercel.json` to ensure pnpm is used:
   ```json
   {
     "buildCommand": "pnpm build",
     "installCommand": "pnpm install"
   }
   ```
3. If Vercel accepts `packageManager` field, also check that's sufficient

## Verification

- `vercel.json` has pnpm commands if it didn't before
- Keep existing `crons` config intact

## Report

Write to `.superpowers/sdd/task-fix2-report.md` with: status, vercel.json changes, any concerns.
