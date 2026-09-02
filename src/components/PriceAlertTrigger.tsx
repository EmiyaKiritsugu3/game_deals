'use client';

import { Bell, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAlerts } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import AuthModal from './AuthModal';
import PriceAlertModal from './PriceAlertModal';

interface PriceAlertTriggerProps {
  readonly gameID: string;
  readonly gameTitle: string;
  readonly currentPrice: number;
  readonly className?: string;
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
        className={`flex items-center gap-2 px-5 py-[0.6rem] rounded-lg bg-muted/50 border border-border/50 text-foreground font-semibold text-[0.9rem] cursor-pointer transition-all duration-200 hover:bg-muted hover:border-border hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 max-[600px]:px-[0.6rem] max-[600px]:[&>span]:hidden ${activeAlert ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgb(from_var(--primary)_r_g_b_/0.15)] hover:bg-primary/20' : ''} ${className}`}
        onClick={handleClick}
        title={activeAlert ? 'Edit Price Alert' : 'Set Price Alert'}
        data-testid="price-alert-trigger"
        aria-label={activeAlert ? 'Alert Active' : 'Alert Me'}
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
