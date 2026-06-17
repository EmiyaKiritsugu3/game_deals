'use client';

import { Bell, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPriceAlertAction, deletePriceAlertAction } from '@/actions/alerts';
import BaseModal from '@/components/ui/BaseModal';
import { useAlerts } from '@/store/alertStore';
import AlertFormFields from './AlertFormFields';
import styles from './PriceAlertModal.module.css';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameID: string;
  gameTitle: string;
  currentPrice: number;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  gameID,
  gameTitle,
  currentPrice,
}: PriceAlertModalProps) {
  const { addAlert, removeAlert, getAlert, hasAlert, setAlertId } = useAlerts();
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

    // 1. Write to localStorage immediately (no data loss if tab closes)
    addAlert({ gameID, gameTitle, targetPrice, currentPrice, isKeyshopAllowed });

    try {
      // 2. Persist to PostgreSQL via server action
      const result = await createPriceAlertAction(gameID, targetPrice);

      // 3. Store the server-returned alert ID for future deletes
      if (result && typeof (result as Record<string, unknown>).id === 'string') {
        setAlertId(gameID, (result as Record<string, unknown>).id as string);
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save alert';
      setSaveError(
        `Saved locally but could not sync: ${message}. The alert will be saved automatically later.`
      );
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
          {isSaving ? 'Saving\u2026' : hasAlert(gameID) ? 'Update Alert' : 'Create Alert'}
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
