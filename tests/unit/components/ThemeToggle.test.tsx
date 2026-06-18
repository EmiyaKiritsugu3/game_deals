/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ThemeToggle from '@/components/ThemeToggle';

const mocks = vi.hoisted(() => {
  let currentTheme = 'dark';
  return {
    setTheme: vi.fn((theme: string) => {
      currentTheme = theme;
    }),
    get theme() {
      return currentTheme;
    },
    set theme(val: string) {
      currentTheme = val;
    },
  };
});

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mocks.theme,
    setTheme: mocks.setTheme,
    themes: ['light', 'dark', 'system'],
    resolvedTheme: mocks.theme === 'system' ? 'dark' : mocks.theme,
  }),
}));

vi.mock('@/components/ThemeToggle.module.css', () => ({
  default: new Proxy({}, { get: () => 'mock-css-class' }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mocks.theme = 'dark';
    mocks.setTheme.mockClear();
  });

  it('renders a toggle button with aria-label indicating current theme', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')?.toLowerCase()).toContain('dark');
  });

  it('cycles from dark to light on click', () => {
    mocks.theme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.setTheme).toHaveBeenCalledWith('light');
  });

  it('cycles from light to system on click', () => {
    mocks.theme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.setTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to dark on click', () => {
    mocks.theme = 'system';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
  });

  it('shows sun icon when in light mode', () => {
    mocks.theme = 'light';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.textContent).toMatch(/☀️|sun|light/i);
  });

  it('shows moon icon when in dark mode', () => {
    mocks.theme = 'dark';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.textContent).toMatch(/🌙|moon|dark/i);
  });

  it('shows system icon when in system mode', () => {
    mocks.theme = 'system';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.textContent).toMatch(/💻|system|auto/i);
  });
});
