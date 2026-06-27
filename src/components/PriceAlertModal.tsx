'use client';

import { Bell, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPriceAlertAction, deletePriceAlertAction } from '@/actions/alerts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAlerts } from '@/store/alertStore';
import AlertFormFields from './AlertFormFields';

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" data-testid="alert-modal">
        <DialogHeader>
          <DialogTitle>
            <Bell size={24} /> Set Price Alert
          </DialogTitle>
          <DialogDescription>
            We will notify you when <span className="text-primary">{gameTitle}</span> hits your
            target price.
          </DialogDescription>
        </DialogHeader>

        <AlertFormFields
          currentPrice={currentPrice}
          targetPrice={targetPrice}
          isKeyshopAllowed={isKeyshopAllowed}
          onTargetPriceChange={setTargetPrice}
          onKeyshopAllowedChange={setIsKeyshopAllowed}
        />

        {saveError && (
          <div className="flex items-center justify-between p-3 px-4 bg-[hsl(0,55%,25%)] border border-[hsl(0,65%,40%)] rounded-lg text-[hsl(0,60%,80%)] text-sm font-semibold mb-4">
            <span>{saveError}</span>
            <button
              type="button"
              className="bg-transparent border border-[hsl(0,65%,50%,0.3)] text-[hsl(0,65%,50%)] px-3 py-1 rounded-md cursor-pointer font-bold text-xs shrink-0 ml-2"
              onClick={() => setSaveError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="px-4 py-3.5 rounded-lg font-bold text-base cursor-pointer transition-all flex items-center justify-center gap-2 bg-muted/50 text-foreground border border-border/50 hover:bg-muted"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-3.5 rounded-lg font-bold text-base cursor-pointer transition-all flex items-center justify-center gap-2 bg-primary text-primary-foreground border-none hover:opacity-90 hover:shadow-[0_4px_15px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="create-alert-button"
          >
            {buttonLabel}
          </button>
          {hasAlert(gameID) && (
            <button
              type="button"
              className="col-span-2 bg-transparent border-none text-[hsl(0,60%,70%)] text-sm font-semibold mt-2 cursor-pointer hover:underline"
              onClick={handleRemove}
              disabled={isSaving}
              data-testid="remove-alert-button"
            >
              <Trash2 size={14} /> Stop tracking this game
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
