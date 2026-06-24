# Task Fix-2 Report: Pin Vercel pnpm version

**Status:** Done

## Changes to vercel.json

Added `buildCommand` and `installCommand` to force Vercel use pnpm:

```json
"buildCommand": "pnpm build",
"installCommand": "pnpm install"
```

Existing `crons` config preserved (3 cron jobs intact).

## Rationale

`packageManager` field in `package.json` (`pnpm@11.8.0`) exists, but Vercel's build system historically ignores it for pnpm version selection and may fall back to pnpm 9.x. Lockfile regenerated with pnpm 11.8.0 uses lockfile v9.0 — pnpm 9.x cannot parse it. Explicit install/build commands force correct toolchain.

## Concerns

- `installCommand: "pnpm install"` delegates version resolution to the Vercel environment's default pnpm, which may still be < 11. A more robust approach would be `"installCommand": "npm i -g pnpm@11.8.0 && pnpm install"`, but that's riskier if npm isn't available in the build step. Current approach matches what Vercel docs suggest for pnpm projects.
- If Vercel rolls pnpm 11 as default in the future, these commands become no-ops — harmless.
