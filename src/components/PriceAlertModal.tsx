'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Trash2, ArrowRight } from 'lucide-react';
import { useAlerts } from '@/store/alertStore';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

interface PriceAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameID: string;
    gameTitle: string;
    currentPrice: number;
}

export default function PriceAlertModal({ isOpen, onClose, gameID, gameTitle, currentPrice }: PriceAlertModalProps) {
    const { addAlert, removeAlert, getAlert, hasAlert } = useAlerts();
    
    // We calculate initial values directly instead of using useEffect
    const getInitialTargetPrice = () => {
        const existingAlert = getAlert(gameID);
        if (existingAlert) return existingAlert.targetPrice;
        return Math.round(currentPrice * 0.8 * 100) / 100;
    };

    const getInitialKeyshopAllowed = () => {
        const existingAlert = getAlert(gameID);
        if (existingAlert) return existingAlert.isKeyshopAllowed;
        return true;
    };

    const [targetPrice, setTargetPrice] = useState(getInitialTargetPrice());
    const [isKeyshopAllowed, setIsKeyshopAllowed] = useState(getInitialKeyshopAllowed());

    // Reset state whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setTargetPrice(getInitialTargetPrice());
            setIsKeyshopAllowed(getInitialKeyshopAllowed());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, gameID, currentPrice]);

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
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="480px" zIndex="50">
            <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="flex items-center gap-2 text-2xl font-black text-white"><Bell size={24} className="text-primary" /> Set Price Alert</h2>
                <p className="text-sm font-medium text-muted-foreground">We will notify you when <span className="font-bold text-white">{gameTitle}</span> hits your target price.</p>
            </div>

                        <div className="flex items-center justify-center gap-6 rounded-xl bg-black/30 p-6 shadow-inner">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current</span>
                                <span className="text-2xl font-black text-white">${currentPrice.toFixed(2)}</span>
                            </div>
                            <ArrowRight size={20} className="text-muted-foreground/50" />
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target</span>
                                <span className="text-2xl font-black text-primary">
                                    ${targetPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <label className="text-sm font-bold text-white">Alert me when price is below:</label>
                            <input 
                                type="range" 
                                min={0} 
                                max={currentPrice * 1.2} 
                                step={0.01}
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                className="h-2 w-full appearance-none rounded-full bg-white/10 outline-hidden [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                            />
                            <div className="relative mx-auto w-[150px]">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">$</span>
                                <input 
                                    type="number" 
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-8 pr-4 text-center text-xl font-black text-white outline-hidden transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                                    step={0.01}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div 
                                className="group flex cursor-pointer items-start gap-4 rounded-xl border border-white/5 bg-white/2 p-4 transition-colors hover:border-white/10 hover:bg-white/5"
                                onClick={() => setIsKeyshopAllowed(!isKeyshopAllowed)}
                            >
                                <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20 transition-colors", isKeyshopAllowed && "border-primary bg-primary")}>
                                    {isKeyshopAllowed && <X size={14} className="text-primary-foreground" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white transition-colors group-hover:text-primary">Include Keyshops (Market Gray)</span>
                                    <span className="text-xs text-muted-foreground">May result in lower prices but higher risk.</span>
                                </div>
                            </div>
                        </div>

            <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                    <button className="flex-1 rounded-lg border border-white/10 bg-transparent py-3 font-bold text-white transition-colors hover:bg-white/5" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="flex-1 rounded-lg bg-primary py-3 font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:bg-emerald-400 hover:shadow-[0_5px_20px_hsl(var(--primary)/0.4)] active:scale-95" onClick={handleSave}>
                        {hasAlert(gameID) ? 'Update Alert' : 'Create Alert'}
                    </button>
                </div>

                {hasAlert(gameID) && (
                    <button className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300" onClick={handleRemove}>
                        <Trash2 size={14} /> Stop tracking this game
                    </button>
                )}
            </div>
        </Modal>
    );
}
