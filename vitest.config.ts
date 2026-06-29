import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/**',
        'src/scripts/**',
        'src/data/**',
        'src/db/**',
        'src/app/global-error.tsx',
        'src/app/auth/error/**',
        'src/app/auth/auth-code-error/**',
        'src/app/og.png/**',
        'sentry.*.config.ts',
        'src/instrumentation.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 76,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
