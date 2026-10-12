import React, { useState, useRef, useEffect } from 'react';
import type { AppNotification, Role } from '../types';
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  currentRole: Role;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentRole,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter relevant notifications for current role or general broadcast
  const relevantNotifications = notifications.filter(
    (n) => !n.targetRole || n.targetRole === 'all' || n.targetRole === currentRole
  );

  const unreadCount = relevantNotifications.filter((n) => !n.read).length;

  const displayedList = relevantNotifications.filter((n) => {
    if (filterMode === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'approved':
        return <CheckCircle2 size={16} className="notif-icon notif-icon--approved" />;
      case 'declined':
        return <XCircle size={16} className="notif-icon notif-icon--declined" />;
      case 'conflict':
        return <AlertTriangle size={16} className="notif-icon notif-icon--conflict" />;
      case 'pending':
        return <Clock size={16} className="notif-icon notif-icon--pending" />;
      default:
        return <Info size={16} className="notif-icon notif-icon--info" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleItemClick = (item: AppNotification) => {
    if (!item.read) {
      onMarkAsRead(item.id);
    }
    onSelectNotification?.(item);
  };

  return (
    <div className="notification-center-wrapper" ref={containerRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        className={`notification-trigger-btn ${isOpen ? 'notification-trigger-btn--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div
          className="notification-dropdown"
          role="region"
          aria-label="Notification center"
        >
          {/* Header */}
          <div className="notification-header">
            <div className="notification-header-title">
              <span className="notif-title-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-action-btn"
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark read</span>
                </button>
              )}
              {relevantNotifications.length > 0 && (
                <button
                  type="button"
                  className="notif-action-btn notif-action-btn--clear"
                  onClick={onClearAll}
                  title="Clear all notifications"
                  aria-label="Clear all notifications"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                type="button"
                className="notif-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="notification-filter-bar">
            <button
              type="button"
              className={`notif-tab ${filterMode === 'all' ? 'notif-tab--active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All ({relevantNotifications.length})
            </button>
            <button
              type="button"
              className={`notif-tab ${filterMode === 'unread' ? 'notif-tab--active' : ''}`}
              onClick={() => setFilterMode('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="notification-list" role="feed" aria-busy="false">
            {displayedList.length === 0 ? (
              <div className="notification-empty-state">
                <BellOff size={28} className="empty-icon" />
                <p className="empty-title">
                  {filterMode === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="empty-subtitle">
                  {filterMode === 'unread'
                    ? 'All alerts have been reviewed.'
                    : 'Permit updates and status alerts will appear here.'}
                </p>
              </div>
            ) : (
              displayedList.map((item) => (
                <article
                  key={item.id}
                  className={`notification-item ${!item.read ? 'notification-item--unread' : ''}`}
                  onClick={() => handleItemClick(item)}
                  role="article"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleItemClick(item);
                    }
                  }}
                >
                  <div className="notif-item-icon-col">{getNotificationIcon(item.type)}</div>
                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <strong className="notif-item-title">{item.title}</strong>
                      {!item.read && <span className="notif-unread-dot" title="Unread" />}
                    </div>
                    <p className="notif-item-message">{item.message}</p>
                    <span className="notif-item-time">{formatTimestamp(item.timestamp)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
