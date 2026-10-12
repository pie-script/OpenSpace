import React from 'react';
import type { PageView, Role, AppNotification } from '../types';
import { Navbar } from './Navbar';
import { RoleBanner } from './RoleBanner';
import { Footer } from './Footer';

interface LayoutProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onResetData: () => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  currentRole,
  onRoleChange,
  onResetData,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onSelectNotification,
  children,
}) => {
  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={onNavigate}
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        notifications={notifications}
        onMarkNotificationRead={onMarkNotificationRead}
        onMarkAllNotificationsRead={onMarkAllNotificationsRead}
        onClearNotifications={onClearNotifications}
        onSelectNotification={onSelectNotification}
      />

      {/* Role Context Notification Banner */}
      <RoleBanner currentRole={currentRole} onRoleChange={onRoleChange} />

      {/* Main Page Area */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>

      {/* Accessible Footer */}
      <Footer onNavigate={onNavigate} onResetData={onResetData} />
    </div>
  );
};
