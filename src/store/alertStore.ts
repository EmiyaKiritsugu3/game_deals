import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PriceAlert } from '@/types/price-alert';

interface AlertState {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'createdAt'>) => void;
  removeAlert: (gameID: string) => void;
  hasAlert: (gameID: string) => boolean;
  getAlert: (gameID: string) => PriceAlert | undefined;
  setAlertId: (gameID: string, alertId: string) => void;
}

export const useAlerts = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      addAlert: (alert) => {
        const existing = get().alerts.find((a) => a.gameID === alert.gameID);
        if (existing) {
          set({
            alerts: get().alerts.map((a) =>
              a.gameID === alert.gameID ? { ...alert, createdAt: Date.now() } : a
            ),
          });
        } else {
          set({ alerts: [...get().alerts, { ...alert, createdAt: Date.now() }] });
        }
      },
      removeAlert: (gameID) =>
        set({
          alerts: get().alerts.filter((a) => a.gameID !== gameID),
        }),
      hasAlert: (gameID) => get().alerts.some((a) => a.gameID === gameID),
      getAlert: (gameID) => get().alerts.find((a) => a.gameID === gameID),
      setAlertId: (gameID, alertId) =>
        set({
          alerts: get().alerts.map((a) => (a.gameID === gameID ? { ...a, alertId } : a)),
        }),
    }),
    {
      name: 'gamedeals-alerts-storage',
    }
  )
);
