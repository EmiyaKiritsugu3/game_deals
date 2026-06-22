'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import styles from './SidebarModal.module.css';

export default function SidebarModal({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const overlay = useRef<HTMLDivElement>(null);

  const dismissModal = useCallback(() => {
    router.back();
  }, [router]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlay.current) {
        if (dismissModal) dismissModal();
      }
    },
    [dismissModal]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissModal();
    },
    [dismissModal]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onKeyDown]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop — Escape handled by document listener
    // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop — Escape handled by document listener
    <div ref={overlay} className={styles.overlay} onClick={onClick}>
      <div className={styles.sidebar}>
        <button
          type="button"
          onClick={dismissModal}
          className={styles.closeBtn}
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
