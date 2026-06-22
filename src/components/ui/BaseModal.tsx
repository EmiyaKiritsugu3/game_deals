'use client';

import { X } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import styles from './BaseModal.module.css';

interface BaseModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly title?: string;
  readonly ariaLabel?: string;
}

export default function BaseModal({ isOpen, onClose, children, title, ariaLabel }: BaseModalProps) {
  const previousActiveElement = useRef<Element | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!modalRef.current) return [];
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(selector));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable.at(-1);
        if (!last) return;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose, getFocusableElements]
  );

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element after animation frame
    requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    });

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);

      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, getFocusableElements]);

  const dialogLabel = ariaLabel || title;

  if (!isOpen) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop — Escape handled by document listener
    // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop — Escape handled by document listener
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {title && (
          <div className={styles.header}>
            <h2>{title}</h2>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
