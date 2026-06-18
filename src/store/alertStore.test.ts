import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PriceAlert } from '@/types/price-alert';
import { useAlerts } from './alertStore';

// Mock persist to be a pass-through — avoids localStorage dependency in Node env
vi.mock('zustand/middleware', () => ({
  persist: <T>(config: T, _options: Record<string, unknown>): T => config,
}));

const mockAlert: Omit<PriceAlert, 'createdAt'> = {
  gameID: 'game-1',
  gameTitle: 'Test Game',
  targetPrice: 9.99,
  currentPrice: 19.99,
  isKeyshopAllowed: false,
  storeId: 'steam',
};

const mockAlert2: Omit<PriceAlert, 'createdAt'> = {
  gameID: 'game-2',
  gameTitle: 'Test Game 2',
  targetPrice: 14.99,
  currentPrice: 29.99,
  isKeyshopAllowed: true,
  storeId: 'gog',
};

describe('alertStore', () => {
  beforeEach(() => {
    useAlerts.setState({ alerts: [] });
  });

  it('starts with an empty alerts array', () => {
    const { alerts } = useAlerts.getState();
    expect(alerts).toEqual([]);
  });

  it('adds an alert to state', () => {
    const { addAlert } = useAlerts.getState();
    addAlert(mockAlert);
    const { alerts } = useAlerts.getState();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].gameID).toBe('game-1');
    expect(alerts[0].gameTitle).toBe('Test Game');
    expect(alerts[0].targetPrice).toBe(9.99);
    expect(alerts[0].currentPrice).toBe(19.99);
    expect(alerts[0].isKeyshopAllowed).toBe(false);
    expect(alerts[0].storeId).toBe('steam');
  });

  it('adds createdAt timestamp when adding an alert', () => {
    const { addAlert } = useAlerts.getState();
    addAlert(mockAlert);
    const { alerts } = useAlerts.getState();
    expect(alerts[0].createdAt).toBeGreaterThan(0);
  });

  it('updates an existing alert for the same gameID', () => {
    const { addAlert } = useAlerts.getState();
    addAlert(mockAlert);
    const updatedAlert: Omit<PriceAlert, 'createdAt'> = {
      ...mockAlert,
      targetPrice: 5.99,
    };
    addAlert(updatedAlert);
    const { alerts } = useAlerts.getState();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].targetPrice).toBe(5.99);
  });

  it('allows multiple alerts to coexist', () => {
    const { addAlert } = useAlerts.getState();
    addAlert(mockAlert);
    addAlert(mockAlert2);
    const { alerts } = useAlerts.getState();
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.gameID)).toEqual(['game-1', 'game-2']);
  });

  it('removes an alert by gameID', () => {
    const { addAlert, removeAlert } = useAlerts.getState();
    addAlert(mockAlert);
    addAlert(mockAlert2);
    removeAlert('game-1');
    const { alerts } = useAlerts.getState();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].gameID).toBe('game-2');
  });

  it('removing a non-existent gameID does nothing', () => {
    const { addAlert, removeAlert } = useAlerts.getState();
    addAlert(mockAlert);
    removeAlert('non-existent');
    const { alerts } = useAlerts.getState();
    expect(alerts).toHaveLength(1);
  });

  it('removing last alert results in empty alerts', () => {
    const { addAlert, removeAlert } = useAlerts.getState();
    addAlert(mockAlert);
    removeAlert('game-1');
    const { alerts } = useAlerts.getState();
    expect(alerts).toEqual([]);
  });

  it('hasAlert returns true for a game that has an alert', () => {
    const { addAlert, hasAlert } = useAlerts.getState();
    addAlert(mockAlert);
    expect(hasAlert('game-1')).toBe(true);
  });

  it('hasAlert returns false for a game without an alert', () => {
    const { hasAlert } = useAlerts.getState();
    expect(hasAlert('game-1')).toBe(false);
  });

  it('hasAlert returns false after alert is removed', () => {
    const { addAlert, removeAlert, hasAlert } = useAlerts.getState();
    addAlert(mockAlert);
    removeAlert('game-1');
    expect(hasAlert('game-1')).toBe(false);
  });

  it('getAlert returns the alert for a given gameID', () => {
    const { addAlert, getAlert } = useAlerts.getState();
    addAlert(mockAlert);
    const alert = getAlert('game-1');
    expect(alert).toBeDefined();
    expect(alert?.gameID).toBe('game-1');
    expect(alert?.targetPrice).toBe(9.99);
  });

  it('getAlert returns undefined for a game without an alert', () => {
    const { getAlert } = useAlerts.getState();
    expect(getAlert('non-existent')).toBeUndefined();
  });

  it('setAlertId sets the alertId for a given gameID', () => {
    const { addAlert, setAlertId, getAlert } = useAlerts.getState();
    addAlert(mockAlert);
    setAlertId('game-1', 'alert-uuid-123');
    const alert = getAlert('game-1');
    expect(alert?.alertId).toBe('alert-uuid-123');
  });

  it('setAlertId does nothing for a non-existent gameID', () => {
    const { setAlertId } = useAlerts.getState();
    expect(() => setAlertId('non-existent', 'some-id')).not.toThrow();
  });

  it('addAlert accepts optional alertId directly (server-first pattern)', () => {
    const { addAlert, getAlert } = useAlerts.getState();
    addAlert({ ...mockAlert, alertId: 'server-uuid-abc' });
    const alert = getAlert('game-1');
    expect(alert?.alertId).toBe('server-uuid-abc');
    // Verify createdAt is still set
    expect(alert?.createdAt).toBeGreaterThan(0);
    // Verify update preserves alertId
    addAlert({ ...mockAlert, targetPrice: 5.99, alertId: 'server-uuid-abc' });
    const updated = getAlert('game-1');
    expect(updated?.targetPrice).toBe(5.99);
    expect(updated?.alertId).toBe('server-uuid-abc');
  });
});
