'use client';

import { Bell, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import AuthModal from './AuthModal';
import PriceAlertModal from './PriceAlertModal';
import styles from './PriceAlertTrigger.module.css';

interface PriceAlertTriggerProps {
  gameID: string;
  gameTitle: string;
  currentPrice: number;
  className?: string;
}

export default function PriceAlertTrigger({
  gameID,
  gameTitle,
  currentPrice,
  className = '',
}: PriceAlertTriggerProps) {
  const { isLoggedIn } = useAuth();
  const { hasAlert } = useAlerts();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeAlert = mounted ? hasAlert(gameID) : false;

  const handleClick = () => {
    if (isLoggedIn) {
      setIsAlertModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger} ${activeAlert ? styles.active : ''} ${className}`}
        onClick={handleClick}
        title={activeAlert ? 'Edit Price Alert' : 'Set Price Alert'}
      >
        {activeAlert ? <BellRing size={20} fill="currentColor" /> : <Bell size={20} />}
        <span>{activeAlert ? 'Alert Active' : 'Alert Me'}</span>
      </button>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        gameID={gameID}
        gameTitle={gameTitle}
        currentPrice={currentPrice}
      />
    </>
  );
}
