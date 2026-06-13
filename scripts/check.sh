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
echo "=== [4/5] Build (com env placeholder do CI) ==="
# Salva .env.local real, usa .env.example (como o CI faz), depois restaura
[ -f .env.local ] && cp .env.local .env.local.checkbak
cp .env.example .env.local
pnpm build
[ -f .env.local.checkbak ] && mv .env.local.checkbak .env.local || rm -f .env.local

echo ""
echo "=== [5/5] Dead Code (knip) ==="
pnpm knip

echo ""
echo "✓ Todos os gates do CI passaram localmente."
