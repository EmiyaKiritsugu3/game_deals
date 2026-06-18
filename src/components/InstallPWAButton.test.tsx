/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import InstallPWAButton from './InstallPWAButton';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

afterAll(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('InstallPWAButton', () => {
  it('renders nothing by default (no beforeinstallprompt fired)', () => {
    const { container } = render(<InstallPWAButton />);
    expect(container.firstChild).toBeNull();
  });
});
