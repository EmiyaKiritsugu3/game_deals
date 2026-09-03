#!/usr/bin/env bash
set -euo pipefail

echo "=== [1/4] Lint (Biome) ==="
bun run lint

echo ""
echo "=== [2/4] Type Check (tsc --noEmit) ==="
bunx tsc --noEmit

echo ""
echo "=== [3/4] Tests + Coverage ==="
bun run test:coverage

echo ""
echo "=== [4/4] Build ==="
[ ! -f .env.local ] && cp .env.example .env.local
bun run build

echo ""
echo "=== [5/5] Dead Code (knip) ==="
bunx knip --no-exit-code

echo ""
echo "✓ Todos os gates do CI passaram localmente."
