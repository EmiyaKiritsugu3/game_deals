import { describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@vercel/analytics/react', () => ({ track }));

import { trackEvent } from './analytics';

describe('trackEvent', () => {
  it('calls track with event name and properties', () => {
    trackEvent('affiliate_click', { store_id: '1' });
    expect(track).toHaveBeenCalledWith('affiliate_click', { store_id: '1' });
  });

  it('calls track with just event name', () => {
    trackEvent('page_view');
    expect(track).toHaveBeenCalledWith('page_view', undefined);
  });

  it('calls track with numeric properties', () => {
    trackEvent('price_alert', { price: 9.99, count: 3 });
    expect(track).toHaveBeenCalledWith('price_alert', { price: 9.99, count: 3 });
  });
});
