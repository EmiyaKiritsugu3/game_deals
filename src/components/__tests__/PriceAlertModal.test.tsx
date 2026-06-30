/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PriceAlertModal from '@/components/PriceAlertModal';

vi.mock('@/actions/alerts', () => ({
  createPriceAlertAction: vi.fn(),
  deletePriceAlertAction: vi.fn(),
}));

vi.mock('@/components/AlertFormFields', () => ({
  default: () => <div>AlertFormFields</div>,
}));

describe('PriceAlertModal', () => {
  it('renders via shadcn Dialog', () => {
    render(
      <PriceAlertModal
        isOpen={true}
        onClose={vi.fn()}
        gameID="test-123"
        gameTitle="Test Game"
        currentPrice={59.99}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Set Price Alert')).toBeInTheDocument();
  });
});
