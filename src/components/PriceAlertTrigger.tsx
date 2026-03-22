'use client';

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { useAlerts } from '@/store/alertStore';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';
import AuthModal from './AuthModal';
import PriceAlertModal from './PriceAlertModal';

interface PriceAlertTriggerProps {
    gameID: string;
    gameTitle: string;
    currentPrice: number;
    className?: string;
}

export default function PriceAlertTrigger({ gameID, gameTitle, currentPrice, className = '' }: PriceAlertTriggerProps) {
    const isHydrated = useHydrated();
    const { isLoggedIn } = useAuth();
    const { hasAlert } = useAlerts();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    const activeAlert = isHydrated ? hasAlert(gameID) : false;

    const handleClick = () => {
        if (!isLoggedIn) {
            setIsAuthModalOpen(true);
        } else {
            setIsAlertModalOpen(true);
        }
    };

    return (
        <>
            <button 
                className={cn(
                    "group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-white/10 px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_15px_rgba(255,255,255,0.1)] active:scale-95",
                    activeAlert && "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)] hover:bg-emerald-400",
                    className
                )}
                onClick={handleClick}
                title={activeAlert ? "Edit Price Alert" : "Set Price Alert"}
            >
                {activeAlert ? <BellRing size={20} fill="currentColor" className="animate-pulse-slow" /> : <Bell size={20} />}
                <span>{activeAlert ? 'Alert Active' : 'Alert Me'}</span>
            </button>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />

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
