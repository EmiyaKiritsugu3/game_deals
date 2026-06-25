import '@testing-library/jest-dom';

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
