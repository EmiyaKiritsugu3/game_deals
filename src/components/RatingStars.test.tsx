/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RatingStars from './RatingStars';

describe('RatingStars — display mode', () => {
  it('renders star svg elements', () => {
    const { container } = render(<RatingStars value={3.5} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(5);
  });

  it('shows tooltip on hover', () => {
    render(<RatingStars value={4.2} />);
    const content = screen.getByRole('img');
    expect(content).toHaveAttribute('aria-label', '4.2 / 5');
  });

  it('renders with showValue prop', () => {
    render(<RatingStars value={3.8} showValue />);
    expect(screen.getByText('3.8')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    const { container } = render(<RatingStars value={0} />);
    const svgs = container.querySelectorAll('path');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('handles max value', () => {
    render(<RatingStars value={5} />);
    const content = screen.getByRole('img');
    expect(content).toHaveAttribute('aria-label', '5.0 / 5');
  });

  it('renders partial star at 0.5', () => {
    const { container } = render(<RatingStars value={2.5} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs[2].querySelector('clipPath')).toBeTruthy();
  });
});

describe('RatingStars — interactive mode', () => {
  it('calls onChange when star clicked', () => {
    const onChange = vi.fn();
    render(<RatingStars value={2} interactive onChange={onChange} />);

    const stars = screen.getAllByRole('radio');
    expect(stars.length).toBe(5);

    fireEvent.click(stars[3]);

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange on Enter keypress', () => {
    const onChange = vi.fn();
    render(<RatingStars value={2} interactive onChange={onChange} />);

    const stars = screen.getAllByRole('radio');
    fireEvent.keyDown(stars[2], { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange on Space keypress', () => {
    const onChange = vi.fn();
    render(<RatingStars value={2} interactive onChange={onChange} />);

    const stars = screen.getAllByRole('radio');
    fireEvent.keyDown(stars[4], { key: ' ' });

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('accepts custom maxStars', () => {
    const onChange = vi.fn();
    render(<RatingStars value={2} maxStars={10} interactive onChange={onChange} />);

    const stars = screen.getAllByRole('radio');
    expect(stars.length).toBe(10);

    fireEvent.click(stars[9]);
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('renders with radiogroup role in interactive mode', () => {
    render(<RatingStars value={2} interactive />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('fires onChange on mouse hover then click', () => {
    const onChange = vi.fn();
    render(<RatingStars value={3} interactive onChange={onChange} />);

    const stars = screen.getAllByRole('radio');

    fireEvent.mouseEnter(stars[2]);
    fireEvent.click(stars[2]);

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
