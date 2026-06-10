# ADR-012: Tooling Chain — Biome, pnpm, Vitest, Playwright

**Status**: Aceito
**Data**: 2026-06-10
**Autor**: EmiyaKiritsugu3

---

## Contexto

Tooling obsoleto (ESLint + Prettier para lint/format, npm para pacotes) impacta DX e performance em projeto solo. Necessitamos:

- **Lint + Format + Import Sort** em uma ferramenta só, rápida (Rust)
- **Package manager** rápido, seguro, disk-efficient
- **Test framework** Vite-native, rápido, TypeScript-first
- **E2E testing** multi-browser com CI integrado

---

## Decisão

### Lint/Format: Biome v2.4+

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off",
        "useShorthandAssign": "error"
      },
      "correctness": {
        "noUnusedVariables": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "jsxQuoteStyle": "double"
    }
  }
}
```

**Migração automática**:
```bash
npx @biomejs/biome migrate eslint-prettier
```

### Package Manager: pnpm 11.5+

```bash
# Migração de npm → pnpm
pnpm import  # Gera pnpm-lock.yaml baseado no package-lock.json
pnpm install --frozen-lockfile
```

**pnpm workspace** (preparação para futuro monorepo):
```yaml
# pnpm-workspace.yaml
packages:
  - '.'
  - 'packages/*'
```

**Config**:
```yaml
# .npmrc
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

### Unit/Integration Tests: Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 60, functions: 60, branches: 50, statements: 60 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### E2E Tests: Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
```

---

## Comandos Diários

```bash
# Package Management
pnpm install               # Instalar dependências
pnpm add react-router-dom  # Adicionar dep
pnpm remove lodash         # Remover dep
pnpm up                    # Update todas deps
pnpm dlx create-next-app   # Executar NPX-style sem instalar global

# Lint & Format (Biome)
pnpm biome ci .            # CI: check lint + format + imports
pnpm biome check .         # Local: lint + format check
pnpm biome format --write . # Format all files
pnpm biome lint --apply     # Auto-fix lint issues
pnpm biome check --fix .    # Fix tudo que der

# Testing
pnpm vitest                # Watch mode (dev)
pnpm vitest run            # CI mode
pnpm vitest run --coverage # With coverage

pnpm playwright test       # E2E tests
pnpm playwright show-report # HTML report

# Full CI Pipeline (local)
pnpm biome ci . && pnpm vitest run && pnpm playwright test
```

---

## Consequências

### Positivas
- **10-30x mais rápido** que ESLint + Prettier (Rust vs JS/TS)
- **Ferramenta única** para lint + format + import sort + LSP
- **Zero config** sensato com `recommended` ruleset
- **pnpm**: 60% menos disk (hard links), mais seguro (lockfile checksums, supply-chain protection)
- **Vitest**: Vite-native, comparte config com app, HMR-aware
- **Playwright**: Multi-browser (Chromium + Firefox + WebKit), tracing, CI-native

### Negativas / Trade-offs
- **Biome v2.4**: Ecossistema menor que ESLint (menos plugins) — mas cobre 200+ regras
- **Biome não tem CSS/JSON formatting completo** em v2.4 (mitigado: Tailwind v4 + Prettier plugin opcional)
- **pnpm**: `node_modules` com symlinks pode causar edge cases com algumas libs (mitigado: `shamefully-hoist=true`)
- **Playwright**: Workers para CI podem ser lentos (mitigado: 3 workers, dependencies otimizadas)

---

## Referências
- [Biome v2.4 Release](https://biomejs.dev/blog/biome-v2-4/) — Embedded snippets, HTML a11y, framework support
- [Biome Blog](https://biomejs.dev/blog/) — Roadmap 2026, v2.1, v2.3, v2.4
- [pnpm 11.5 Blog](https://pnpm.io/blog/releases/11.5) — hoistingLimits, supply-chain security
- [Vitest Docs](https://vitest.dev/guide/)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Tooling overview
- `biome.json` — Config file
- `pnpm-workspace.yaml` — Workspace config
- `vitest.config.ts` — Test config
- `playwright.config.ts` — E2E config