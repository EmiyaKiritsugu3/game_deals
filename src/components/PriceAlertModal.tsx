'use client';

import { ArrowRight, Bell, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import { useAlerts } from '@/store/alertStore';
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
      // Default target = 20% discount from current
      setTargetPrice(Math.round(currentPrice * 0.8 * 100) / 100);
    }
  }, [existingAlert, currentPrice]);

  const handleSave = () => {
    addAlert({
      gameID,
      gameTitle,
      targetPrice,
      currentPrice,
      isKeyshopAllowed,
    });
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

      <div className={styles.priceDisplay}>
        <div className={styles.priceItem}>
          <span className={styles.priceLabel}>Current</span>
          <span className={styles.priceValue}>${currentPrice.toFixed(2)}</span>
        </div>
        <ArrowRight size={20} className={styles.arrow} />
        <div className={styles.priceItem}>
          <span className={styles.priceLabel}>Target</span>
          <span className={styles.priceValue} style={{ color: 'hsl(var(--primary))' }}>
            ${targetPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <div className={styles.inputSection}>
        <label className={styles.inputLabel} htmlFor="price-range">
          Alert me when price is below:
        </label>
        <input
          id="price-range"
          type="range"
          min={0}
          max={currentPrice * 1.2}
          step={0.01}
          value={targetPrice}
          onChange={(e) => setTargetPrice(Number.parseFloat(e.target.value))}
          className={styles.rangeInput}
        />
        <div className={styles.numberInputGroup}>
          <span className={styles.currencySymbol}>$</span>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(Number.parseFloat(e.target.value))}
            className={styles.numberInput}
            step={0.01}
          />
        </div>
      </div>

      <div className={styles.optionsSection}>
        <label className={styles.checkboxGroup}>
          <input
            type="checkbox"
            className={styles.hiddenCheckbox}
            checked={isKeyshopAllowed}
            onChange={() => setIsKeyshopAllowed(!isKeyshopAllowed)}
          />
          <div className={`${styles.checkbox} ${isKeyshopAllowed ? styles.checked : ''}`}>
            {isKeyshopAllowed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Checked"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <span className={styles.checkboxLabel}>Include Keyshops (Market Gray)</span>
            <span className={styles.checkboxSublabel}>
              May result in lower prices but higher risk.
            </span>
          </div>
        </label>
      </div>

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
