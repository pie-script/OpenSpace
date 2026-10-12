import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '../components/NotificationCenter';
import type { AppNotification } from '../types';

describe('NotificationCenter Component', () => {
  const sampleNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      title: 'Booking Approved',
      message: 'Your booking for Youth Orchestra was approved.',
      timestamp: '2026-10-12T14:30:00Z',
      read: false,
      type: 'approved',
      targetRole: 'all',
    },
    {
      id: 'notif-2',
      title: 'Conflict Notice',
      message: 'Schedule overlap detected on Oct 18.',
      timestamp: '2026-10-12T12:00:00Z',
      read: false,
      type: 'conflict',
      targetRole: 'staff',
    },
    {
      id: 'notif-3',
      title: 'Permit Declined',
      message: 'Request exceeded noise limits.',
      timestamp: '2026-10-11T16:00:00Z',
      read: true,
      type: 'declined',
      targetRole: 'organizer',
    },
  ];

  it('renders trigger button with unread count badge for organizer', () => {
    render(
      <NotificationCenter
        notifications={sampleNotifications}
        currentRole="organizer"
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    // Organizer sees notif-1 (all, unread) and notif-3 (organizer, read) => 1 unread
    const trigger = screen.getByRole('button', { name: /notifications, 1 unread/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens notification drawer on click and lists notifications', async () => {
    const user = userEvent.setup();
    render(
      <NotificationCenter
        notifications={sampleNotifications}
        currentRole="organizer"
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: /notifications/i });
    await user.click(trigger);

    expect(screen.getByRole('region', { name: /notification center/i })).toBeInTheDocument();
    expect(screen.getByText('Booking Approved')).toBeInTheDocument();
    expect(screen.getByText('Permit Declined')).toBeInTheDocument();
  });

  it('triggers mark as read when clicking an unread item', async () => {
    const user = userEvent.setup();
    const handleMarkAsRead = vi.fn();

    render(
      <NotificationCenter
        notifications={sampleNotifications}
        currentRole="organizer"
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    const unreadItem = screen.getByText('Booking Approved');
    await user.click(unreadItem);

    expect(handleMarkAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('triggers mark all as read and clear all callbacks', async () => {
    const user = userEvent.setup();
    const handleMarkAll = vi.fn();
    const handleClear = vi.fn();

    render(
      <NotificationCenter
        notifications={sampleNotifications}
        currentRole="organizer"
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={handleMarkAll}
        onClearAll={handleClear}
      />
    );

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    const markAllBtn = screen.getByRole('button', { name: /mark all notifications as read/i });
    await user.click(markAllBtn);
    expect(handleMarkAll).toHaveBeenCalled();

    const clearBtn = screen.getByRole('button', { name: /clear all notifications/i });
    await user.click(clearBtn);
    expect(handleClear).toHaveBeenCalled();
  });
});
