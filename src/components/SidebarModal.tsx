'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import styles from './SidebarModal.module.css';

export default function SidebarModal({ children }: { children: React.ReactNode }) {
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
    <motion.div
      ref={overlay}
      className={styles.overlay}
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={styles.sidebar}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <button
          type="button"
          onClick={dismissModal}
          className={styles.closeBtn}
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>
        <div className={styles.content}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
