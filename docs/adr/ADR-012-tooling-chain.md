# ADR-012: Tooling Chain — Biome, pnpm, Vitest, Playwright

**Status**: Accepted
**Date**: 2026-06-10
**Author**: EmiyaKiritsugu3

---

## Context

Outdated tooling (ESLint + Prettier for lint/format, npm for packages) impacts DX and performance in solo project. We need:

- **Lint + Format + Import Sort** in a single fast tool (Rust)
- **Package manager** fast, secure, disk-efficient
- **Test framework** Vite-native, fast, TypeScript-first
- **E2E testing** multi-browser with integrated CI

---

## Decision

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

**Automatic migration**:
```bash
npx @biomejs/biome migrate eslint-prettier
```

### Package Manager: pnpm 11.5+

```bash
# Migration from npm → pnpm
pnpm import  # Generates pnpm-lock.yaml based on package-lock.json
pnpm install --frozen-lockfile
```

**pnpm workspace** (preparation for future monorepo):
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

## Daily Commands

```bash
# Package Management
pnpm install               # Install dependencies
pnpm add react-router-dom  # Add dependency
pnpm remove lodash         # Remove dependency
pnpm up                    # Update all deps
pnpm dlx create-next-app   # Run NPX-style without global install

# Lint & Format (Biome)
pnpm biome ci .            # CI: check lint + format + imports
pnpm biome check .         # Local: lint + format check
pnpm biome format --write . # Format all files
pnpm biome lint --apply     # Auto-fix lint issues
pnpm biome check --fix .    # Fix everything

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

## Consequences

### Positive
- **10-30x faster** than ESLint + Prettier (Rust vs JS/TS)
- **Single tool** for lint + format + import sort + LSP
- **Sensible zero config** with `recommended` ruleset
- **pnpm**: 60% less disk (hard links), more secure (lockfile checksums, supply-chain protection)
- **Vitest**: Vite-native, shares config with app, HMR-aware
- **Playwright**: Multi-browser (Chromium + Firefox + WebKit), tracing, CI-native

### Negative / Trade-offs
- **Biome v2.4**: Smaller ecosystem than ESLint (fewer plugins) — but covers 200+ rules
- **Biome lacks full CSS/JSON formatting** in v2.4 (mitigated: Tailwind v4 + optional Prettier plugin)
- **pnpm**: `node_modules` with symlinks can cause edge cases with some libs (mitigated: `shamefully-hoist=true`)
- **Playwright**: CI workers can be slow (mitigated: 3 workers, optimized dependencies)

---

## References
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