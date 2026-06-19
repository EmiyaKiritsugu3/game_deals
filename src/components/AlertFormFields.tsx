import { ArrowRight } from 'lucide-react';
import styles from './PriceAlertModal.module.css';

export interface AlertFormFieldsProps {
  readonly currentPrice: number;
  readonly targetPrice: number;
  readonly isKeyshopAllowed: boolean;
  readonly onTargetPriceChange: (price: number) => void;
  readonly onKeyshopAllowedChange: (allowed: boolean) => void;
}

export default function AlertFormFields({
  currentPrice,
  targetPrice,
  isKeyshopAllowed,
  onTargetPriceChange,
  onKeyshopAllowedChange,
}: AlertFormFieldsProps) {
  return (
    <>
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
          onChange={(e) => onTargetPriceChange(Number.parseFloat(e.target.value))}
          className={styles.rangeInput}
        />
        <div className={styles.numberInputGroup}>
          <span className={styles.currencySymbol}>$</span>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => onTargetPriceChange(Number.parseFloat(e.target.value))}
            className={styles.numberInput}
            step={0.01}
            data-testid="target-price-input"
          />
        </div>
      </div>

      <div className={styles.optionsSection}>
        <label className={styles.checkboxGroup}>
          <input
            type="checkbox"
            className={styles.hiddenCheckbox}
            checked={isKeyshopAllowed}
            onChange={() => onKeyshopAllowedChange(!isKeyshopAllowed)}
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
                <path d="M5 12l5 5L20 7" />
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
    </>
  );
}
