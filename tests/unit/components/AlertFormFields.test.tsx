// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AlertFormFields from '../../../src/components/AlertFormFields';

describe('AlertFormFields', () => {
  const defaultProps = {
    currentPrice: 50,
    targetPrice: 40,
    isKeyshopAllowed: true,
    onTargetPriceChange: vi.fn(),
    onKeyshopAllowedChange: vi.fn(),
  };

  it('adds peer-focus-visible styling to the custom checkbox wrapper', () => {
    const { container } = render(<AlertFormFields {...defaultProps} />);
    const hiddenInput = container.querySelector('input[type="checkbox"]');
    const visualCheckboxWrapper = container.querySelector('input[type="checkbox"]')?.nextElementSibling;

    expect(hiddenInput).toHaveClass('peer');
    expect(visualCheckboxWrapper).toHaveClass('peer-focus-visible:outline-2', 'peer-focus-visible:outline-primary', 'peer-focus-visible:outline-offset-2');
  });
});
