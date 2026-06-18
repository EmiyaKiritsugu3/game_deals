'use client';

import { Bell, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPriceAlertAction, deletePriceAlertAction } from '@/actions/alerts';
import BaseModal from '@/components/ui/BaseModal';
import { useAlerts } from '@/store/alertStore';
import AlertFormFields from './AlertFormFields';
import styles from './PriceAlertModal.module.css';

interface PriceAlertModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly gameID: string;
  readonly gameTitle: string;
  readonly currentPrice: number;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  gameID,
  gameTitle,
  currentPrice,
}: PriceAlertModalProps) {
  const { addAlert, removeAlert, getAlert, hasAlert } = useAlerts();
  const existingAlert = getAlert(gameID);

  const [targetPrice, setTargetPrice] = useState(currentPrice);
  const [isKeyshopAllowed, setIsKeyshopAllowed] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (existingAlert) {
      setTargetPrice(existingAlert.targetPrice);
      setIsKeyshopAllowed(existingAlert.isKeyshopAllowed);
    } else {
      setTargetPrice(Math.round(currentPrice * 0.8 * 100) / 100);
    }
  }, [existingAlert, currentPrice]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Persist to PostgreSQL via server action FIRST
      const result = await createPriceAlertAction(gameID, targetPrice);

      // 2. Update local state ONLY on server success
      addAlert({
        gameID,
        gameTitle,
        targetPrice,
        currentPrice,
        isKeyshopAllowed,
        alertId: typeof result?.id === 'string' ? result.id : undefined,
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save alert';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!existingAlert) {
      removeAlert(gameID);
      onClose();
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Delete from PostgreSQL first (server-first for deletes)
      if (existingAlert.alertId) {
        await deletePriceAlertAction(existingAlert.alertId);
      }
      // 2. Then remove from localStorage
      removeAlert(gameID);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove alert';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const buttonLabel = (() => {
    if (isSaving) return 'Saving\u2026';
    if (hasAlert(gameID)) return 'Update Alert';
    return 'Create Alert';
  })();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} ariaLabel="Set price alert">
      <div className={styles.header}>
        <h2>
          <Bell size={24} className={styles.bellIcon} /> Set Price Alert
        </h2>
        <p>
          We will notify you when <span className={styles.gameTitle}>{gameTitle}</span> hits your
          target price.
        </p>
      </div>

      <AlertFormFields
        currentPrice={currentPrice}
        targetPrice={targetPrice}
        isKeyshopAllowed={isKeyshopAllowed}
        onTargetPriceChange={setTargetPrice}
        onKeyshopAllowedChange={setIsKeyshopAllowed}
      />

      {saveError && (
        <div className={styles.error}>
          <span>{saveError}</span>
          <button type="button" className={styles.dismissError} onClick={() => setSaveError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className={styles.actionButtons}>
        <button
          type="button"
          className={`${styles.button} ${styles.cancelButton}`}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.saveButton}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {buttonLabel}
        </button>
        {hasAlert(gameID) && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemove}
            disabled={isSaving}
          >
            <Trash2 size={14} /> Stop tracking this game
          </button>
        )}
      </div>
    </BaseModal>
  );
}
