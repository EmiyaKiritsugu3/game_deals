'use client';

import * as React from 'react';
import { type LegalDocKey, LegalModal, openLegalDoc } from '@/components/game/legal-modal';

/**
 * Mounts the legal modal at the app root and listens for `dealforge:open-legal`
 * custom events so any component can open a legal document by dispatching
 * `window.dispatchEvent(new CustomEvent("dealforge:open-legal", { detail: "privacy" }))`.
 */
export function LegalModalHost() {
  const [open, setOpen] = React.useState(false);
  const [docKey, setDocKey] = React.useState<LegalDocKey>('privacy');

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LegalDocKey>).detail;
      if (detail && typeof detail === 'string') {
        setDocKey(detail);
        setOpen(true);
      }
    };
    window.addEventListener('dealforge:open-legal', handler);
    return () => window.removeEventListener('dealforge:open-legal', handler);
  }, []);

  return <LegalModal open={open} onOpenChange={setOpen} docKey={docKey} />;
}

export { openLegalDoc };
