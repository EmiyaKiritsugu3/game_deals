# ADR-012: Tooling Chain — Biome, Bun, Vitest, Playwright

**Status**: Updated (2026-07-01) — pnpm migrated to Bun

---

## Context

Outdated tooling (ESLint + Prettier for lint/format, npm for packages) impacts DX and performance in solo project. We need:

- **Lint + Format + Import Sort** in a single fast tool (Rust)
- **Package manager** fast, secure, disk-efficient
- **Runtime** fast JS/TS runtime replacing Node for development and CI
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

### Package Manager: Bun 1.3.13

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
# Package Management (via Bun)
bun install                # Install dependencies
bun add react-router-dom   # Add dependency
bun remove lodash          # Remove dependency
bun update                 # Update all deps
bunx create-next-app       # Run NPX-style without global install

# Lint & Format (Biome)
bunx biome ci src/         # CI: check lint + format + imports
bunx biome check src/      # Local: lint + format check
bunx biome format --write . # Format all files
bunx biome lint --write .   # Auto-fix lint issues
bunx biome check --write .  # Fix everything

# Testing (via bunx vitest — preserves vitest runner)
bunx vitest                # Watch mode (dev)
bunx vitest run            # CI mode
bunx vitest run --coverage # With coverage

bunx playwright test       # E2E tests
bunx playwright show-report # HTML report

# Full CI Pipeline (local)
bunx biome check src/ && bunx vitest run && bunx playwright test
```

---

## Consequences

### Positive
- **10-30x faster** than ESLint + Prettier (Rust vs JS/TS)
- **Single tool** for lint + format + import sort + LSP
- **Sensible zero config** with `recommended` ruleset
- **Bun**: 10x faster installs, built-in test runner + bundler + runtime, Node-compatible. Hoisted linker for node_modules compat. Automatic lockfile migration from pnpm/npm/yarn.
- **Vitest**: Vite-native, shares config with app, HMR-aware
- **Playwright**: Multi-browser (Chromium + Firefox + WebKit), tracing, CI-native

### Negative / Trade-offs
- **Biome v2.4**: Smaller ecosystem than ESLint (fewer plugins) — but covers 200+ rules
- **Biome lacks full CSS/JSON formatting** in v2.4 (mitigated: Tailwind v4 + optional Prettier plugin)
- **Bun hoisted linker**: can extract global cache into `node_modules` via symlinks, causing Biome false-positives when scanning root (mitigated: `biome check src/`)
- **Playwright**: CI workers can be slow (mitigated: 3 workers, optimized dependencies)

---

## References
- [Biome v2.4 Release](https://biomejs.dev/blog/biome-v2-4/) — Embedded snippets, HTML a11y, framework support
- [Biome Blog](https://biomejs.dev/blog/) — Roadmap 2026, v2.1, v2.3, v2.4
- [Bun Docs](https://bun.sh/docs) — Runtime, package manager, test runner
- [pnpm 11.5 Blog](https://pnpm.io/blog/releases/11.5) — hoistingLimits, supply-chain security (previous package manager)
- [Vitest Docs](https://vitest.dev/guide/)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [ADR-001: Tech Stack](ADR-001-tech-stack.md) — Tooling overview
- `biome.json` — Config file
- `bunfig.toml` — Bun config (hoisted linker, frozen lockfile, trusted deps, cache dir)
- `bun.lock` — Bun lockfile (auto-migrated from pnpm-lock.yaml)
- `vitest.config.ts` — Test config
- `playwright.config.ts` — E2E config