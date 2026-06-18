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

  it('renders a toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has accessible aria-label based on current theme', () => {
    mocks.theme = 'dark';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toBe('Switch to system theme');
  });

  it('cycles from light to dark on click', () => {
    mocks.theme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system on click', () => {
    mocks.theme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.setTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light on click', () => {
    mocks.theme = 'system';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.setTheme).toHaveBeenCalledWith('light');
  });

  it('renders an SVG icon for the current theme', () => {
    mocks.theme = 'light';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('provides title attribute describing action', () => {
    mocks.theme = 'light';
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });
});
