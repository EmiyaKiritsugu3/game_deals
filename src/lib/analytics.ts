import { track } from '@vercel/analytics/react';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, properties?: EventProperties): void {
  track(name, properties);
}
