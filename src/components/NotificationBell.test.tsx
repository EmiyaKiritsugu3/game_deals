/**
 * @vitest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
}));

const mockGetNotifications = vi.fn();
const mockMarkAllRead = vi.fn();
const mockMarkRead = vi.fn();

vi.mock('@/actions/notifications', () => ({
  getNotificationsAction: (...args: unknown[]) => mockGetNotifications(...args),
  markAllNotificationsReadAction: (...args: unknown[]) => mockMarkAllRead(...args),
  markNotificationReadAction: (...args: unknown[]) => mockMarkRead(...args),
}));

let mockIsLoggedIn = false;
vi.mock('@/store/authStore', () => ({
  useAuth: vi.fn(() => ({ isLoggedIn: mockIsLoggedIn })),
}));

import NotificationBell from './NotificationBell';

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mockIsLoggedIn = false;
    mockGetNotifications.mockReset();
    mockMarkAllRead.mockReset();
    mockMarkRead.mockReset();
  });

  it('returns null when not logged in', () => {
    const { container } = renderWithQuery(<NotificationBell />);
    expect(container.firstChild).toBeNull();
  });

  it('renders bell icon when logged in', () => {
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({ items: [], unread: 0 });
    renderWithQuery(<NotificationBell />);
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('shows unread count badge', async () => {
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({
      items: [{ id: '1', title: 'Test', body: null, createdAt: new Date(), readAt: null }],
      unread: 1,
    });
    renderWithQuery(<NotificationBell />);
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('shows "99+" for >99 unread', async () => {
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({ items: [], unread: 150 });
    renderWithQuery(<NotificationBell />);
    expect(await screen.findByText('99+')).toBeInTheDocument();
  });

  it('opens panel on click', async () => {
    const user = userEvent.setup();
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({ items: [], unread: 0 });
    renderWithQuery(<NotificationBell />);
    await user.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows "No notifications yet." when empty', async () => {
    const user = userEvent.setup();
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({ items: [], unread: 0 });
    renderWithQuery(<NotificationBell />);
    await user.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
  });

  it('renders notification items', async () => {
    const user = userEvent.setup();
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({
      items: [
        {
          id: '1',
          title: 'Price Drop',
          body: 'Game is cheaper',
          createdAt: new Date(),
          readAt: null,
        },
      ],
      unread: 1,
    });
    renderWithQuery(<NotificationBell />);
    await user.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('Price Drop')).toBeInTheDocument();
  });

  it('calls markAllNotificationsReadAction on "Mark all read" click', async () => {
    const user = userEvent.setup();
    mockIsLoggedIn = true;
    mockGetNotifications.mockResolvedValue({
      items: [{ id: '1', title: 'Test', body: null, createdAt: new Date(), readAt: null }],
      unread: 1,
    });
    mockMarkAllRead.mockResolvedValue(undefined);
    renderWithQuery(<NotificationBell />);
    await user.click(screen.getByLabelText('Notifications'));
    await user.click(screen.getByText('Mark all read'));
    expect(mockMarkAllRead).toHaveBeenCalled();
  });
});
