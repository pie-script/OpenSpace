import React from 'react';
import type { PageView, Role } from '../types';
import { Navbar } from './Navbar';
import { RoleBanner } from './RoleBanner';
import { Footer } from './Footer';

interface LayoutProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onResetData: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  currentRole,
  onRoleChange,
  onResetData,
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
