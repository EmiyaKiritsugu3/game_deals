#!/usr/bin/env bash
set -euo pipefail

echo "=== [1/5] Lint (Biome) ==="
pnpm lint

echo ""
echo "=== [2/5] Type Check (tsc --noEmit) ==="
pnpm exec tsc --noEmit

echo ""
echo "=== [3/5] Tests + Coverage ==="
pnpm test:coverage

echo ""
echo "=== [4/5] Build ==="
[ ! -f .env.local ] && cp .env.example .env.local
pnpm build

echo ""
echo "=== [5/5] Dead Code (knip) ==="
pnpm knip --no-exit-code

echo ""
echo "=== [6/6] Codebase Intelligence (fallow) ==="
pnpm fallow:audit

echo ""
echo "✓ Todos os gates do CI passaram localmente."
