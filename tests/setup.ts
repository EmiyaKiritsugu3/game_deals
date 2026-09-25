import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ponytail: rate limit is infra, not business logic — no-op in tests to avoid
// next/headers "outside request scope" + DB coupling in unit tests.
vi.mock('@/lib/server-action-rate-limit', () => ({
  assertRateLimit: vi.fn().mockResolvedValue(undefined),
}));

// ponytail: minimal IntersectionObserver stub — required by motion/react in jsdom
class MockObserver {
  root: Element | null = null;
  rootMargin = '';
  thresholds: number[] = [0];
  scrollMargin = '';
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockObserver,
  writable: true,
  configurable: true,
});

// ponytail: sentry/nextjs 10.73 ships broken node CJS shims (fileURLToPath on
// ESM url); global stub keeps every suite green regardless of import chain.
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((fn: (scope: { setTag: () => void }) => void) =>
    fn({ setTag: () => {} })
  ),
}));
