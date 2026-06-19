/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DealsBadge from './DealsBadge';

describe('DealsBadge', () => {
  it('renders HL badge', () => {
    render(<DealsBadge type="HL" />);
    expect(screen.getByText('HL')).toBeInTheDocument();
  });

  it('renders EPIC badge with text', () => {
    render(<DealsBadge type="EPIC" />);
    expect(screen.getByText('🔥 EPIC')).toBeInTheDocument();
  });

  it('renders EPIC badge compact', () => {
    render(<DealsBadge type="EPIC" compact />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('renders FREE badge', () => {
    render(<DealsBadge type="FREE" />);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('renders RATING badge with value', () => {
    render(<DealsBadge type="RATING" value={85} />);
    expect(screen.getByText('★ 85%')).toBeInTheDocument();
  });

  it('returns null for RATING with no value', () => {
    const { container } = render(<DealsBadge type="RATING" />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    render(<DealsBadge type="HL" className="extra" />);
    const span = screen.getByText('HL');
    expect(span.className).toContain('extra');
  });

  it('returns null for unknown type', () => {
    const { container } = render(<DealsBadge type={'UNKNOWN' as 'HL'} />);
    expect(container.firstChild).toBeNull();
  });
});
