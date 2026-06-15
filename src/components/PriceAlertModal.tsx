'use client';

import { Bell, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const { addAlert, removeAlert, getAlert, hasAlert } = useAlerts();
  const existingAlert = getAlert(gameID);

  const [targetPrice, setTargetPrice] = useState(currentPrice);
  const [isKeyshopAllowed, setIsKeyshopAllowed] = useState(true);

  useEffect(() => {
    if (existingAlert) {
      setTargetPrice(existingAlert.targetPrice);
      setIsKeyshopAllowed(existingAlert.isKeyshopAllowed);
    } else {
      setTargetPrice(Math.round(currentPrice * 0.8 * 100) / 100);
    }
  }, [existingAlert, currentPrice]);

  const handleSave = () => {
    addAlert({ gameID, gameTitle, targetPrice, currentPrice, isKeyshopAllowed });
    onClose();
  };

  const handleRemove = () => {
    removeAlert(gameID);
    onClose();
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

      <div className={styles.actionButtons}>
        <button
          type="button"
          className={`${styles.button} ${styles.cancelButton}`}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.saveButton}`}
          onClick={handleSave}
        >
          {hasAlert(gameID) ? 'Update Alert' : 'Create Alert'}
        </button>
        {hasAlert(gameID) && (
          <button type="button" className={styles.removeButton} onClick={handleRemove}>
            <Trash2 size={14} /> Stop tracking this game
          </button>
        )}
      </div>
    </BaseModal>
  );
}
