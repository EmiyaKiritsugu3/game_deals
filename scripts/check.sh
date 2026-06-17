#!/usr/bin/env bash
set -euo pipefail

echo "=== [1/4] Lint (Biome) ==="
pnpm lint

echo ""
echo "=== [2/4] Type Check (tsc --noEmit) ==="
pnpm exec tsc --noEmit

echo ""
echo "=== [3/4] Tests + Coverage ==="
pnpm test:coverage

echo ""
echo "=== [4/4] Build ==="
[ ! -f .env.local ] && cp .env.example .env.local
pnpm build

echo ""
echo "=== [5/5] Dead Code (knip) ==="
pnpm knip --no-exit-code

echo ""
echo "✓ Todos os gates do CI passaram localmente."
