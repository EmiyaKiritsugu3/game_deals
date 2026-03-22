'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, ArrowRight } from 'lucide-react';
import { useAlerts } from '@/store/alertStore';
import styles from './PriceAlertModal.module.css';

interface PriceAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameID: string;
    gameTitle: string;
    currentPrice: number;
}

export default function PriceAlertModal({ isOpen, onClose, gameID, gameTitle, currentPrice }: PriceAlertModalProps) {
    const { addAlert, removeAlert, getAlert, hasAlert } = useAlerts();
    const existingAlert = getAlert(gameID);
    
    const [targetPrice, setTargetPrice] = useState(currentPrice);
    const [isKeyshopAllowed, setIsKeyshopAllowed] = useState(true);

    useEffect(() => {
        if (isOpen) {
            if (existingAlert) {
                setTargetPrice(existingAlert.targetPrice);
                setIsKeyshopAllowed(existingAlert.isKeyshopAllowed);
            } else {
                // Default target = 20% discount from current
                setTargetPrice(Math.round(currentPrice * 0.8 * 100) / 100);
            }
        }
    }, [isOpen, existingAlert, currentPrice]);

    const handleSave = () => {
        addAlert({
            gameID,
            gameTitle,
            targetPrice,
            currentPrice,
            isKeyshopAllowed
        });
        onClose();
    };

    const handleRemove = () => {
        removeAlert(gameID);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className={styles.modalOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div 
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.closeButton} onClick={onClose}>
                            <X size={20} />
                        </button>

                        <div className={styles.header}>
                            <h2><Bell size={24} className={styles.bellIcon} /> Set Price Alert</h2>
                            <p>We will notify you when <span className={styles.gameTitle}>{gameTitle}</span> hits your target price.</p>
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
                            <label className={styles.inputLabel}>Alert me when price is below:</label>
                            <input 
                                type="range" 
                                min={0} 
                                max={currentPrice * 1.2} 
                                step={0.01}
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                className={styles.rangeInput}
                            />
                            <div className={styles.numberInputGroup}>
                                <span className={styles.currencySymbol}>$</span>
                                <input 
                                    type="number" 
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                    className={styles.numberInput}
                                    step={0.01}
                                />
                            </div>
                        </div>

                        <div className={styles.optionsSection}>
                            <div 
                                className={styles.checkboxGroup}
                                onClick={() => setIsKeyshopAllowed(!isKeyshopAllowed)}
                            >
                                <div className={`${styles.checkbox} ${isKeyshopAllowed ? styles.checked : ''}`}>
                                    {isKeyshopAllowed && <X size={14} color="white" />}
                                </div>
                                <div>
                                    <span className={styles.checkboxLabel}>Include Keyshops (Market Gray)</span>
                                    <span className={styles.checkboxSublabel}>May result in lower prices but higher risk.</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.actionButtons}>
                            <button className={`${styles.button} ${styles.cancelButton}`} onClick={onClose}>
                                Cancel
                            </button>
                            <button className={`${styles.button} ${styles.saveButton}`} onClick={handleSave}>
                                {hasAlert(gameID) ? 'Update Alert' : 'Create Alert'}
                            </button>
                            
                            {hasAlert(gameID) && (
                                <button className={styles.removeButton} onClick={handleRemove}>
                                    <Trash2 size={14} /> Stop tracking this game
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
