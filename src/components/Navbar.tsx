import React, { useState } from 'react';
import type { PageView, Role, AppNotification } from '../types';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { School, Compass, Shield, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentRole,
  onRoleChange,
  notifications = [],
  onMarkNotificationRead = () => {},
  onMarkAllNotificationsRead = () => {},
  onClearNotifications = () => {},
  onSelectNotification,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: PageView) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Brand */}
        <div className="navbar__brand">
          <button
            type="button"
            className="navbar__logo-button"
            onClick={() => handleNavClick('home')}
            aria-label="OpenSpace Home"
          >
            <div className="navbar__logo-icon">
              <School size={22} aria-hidden="true" />
            </div>
            <div className="navbar__logo-text">
              <span className="navbar__title">OpenSpace</span>
              <span className="navbar__subtitle">After-Hours Campus Bookings</span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="navbar__nav" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-link ${currentPage === 'home' ? 'nav-link--active' : ''}`}
            onClick={() => handleNavClick('home')}
            aria-current={currentPage === 'home' ? 'page' : undefined}
          >
            Home
          </button>
          {currentRole === 'organizer' && (
            <button
              type="button"
              className={`nav-link ${currentPage === 'venues' ? 'nav-link--active' : ''}`}
              onClick={() => handleNavClick('venues')}
              aria-current={currentPage === 'venues' ? 'page' : undefined}
            >
              <Compass size={16} aria-hidden="true" />
              <span>Browse Venues</span>
            </button>
          )}
          {currentRole === 'staff' && (
            <button
              type="button"
              className={`nav-link ${currentPage === 'staff' ? 'nav-link--active' : ''}`}
              onClick={() => handleNavClick('staff')}
              aria-current={currentPage === 'staff' ? 'page' : undefined}
            >
              <Shield size={16} aria-hidden="true" />
              <span>Staff Dashboard</span>
              <span className="nav-link__badge">Active</span>
            </button>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar__actions">
          <NotificationCenter
            notifications={notifications}
            currentRole={currentRole}
            onMarkAsRead={onMarkNotificationRead}
            onMarkAllAsRead={onMarkAllNotificationsRead}
            onClearAll={onClearNotifications}
            onSelectNotification={onSelectNotification}
          />
          <RoleSwitcher
            currentRole={currentRole}
            onRoleChange={onRoleChange}
            compact
          />
        </div>

        {/* Mobile Header Actions & Menu Toggle */}
        <div className="navbar__mobile-toggle">
          <NotificationCenter
            notifications={notifications}
            currentRole={currentRole}
            onMarkAsRead={onMarkNotificationRead}
            onMarkAllAsRead={onMarkAllNotificationsRead}
            onClearAll={onClearNotifications}
            onSelectNotification={onSelectNotification}
          />
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="navbar__mobile-menu"
          aria-label="Mobile navigation"
        >
          <nav className="mobile-nav-links">
            <button
              type="button"
              className={`mobile-nav-link ${currentPage === 'home' ? 'mobile-nav-link--active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Home
            </button>
            {currentRole === 'organizer' && (
              <button
                type="button"
                className={`mobile-nav-link ${currentPage === 'venues' ? 'mobile-nav-link--active' : ''}`}
                onClick={() => handleNavClick('venues')}
              >
                <Compass size={18} aria-hidden="true" />
                <span>Browse Venues</span>
              </button>
            )}
            {currentRole === 'staff' && (
              <button
                type="button"
                className={`mobile-nav-link ${currentPage === 'staff' ? 'mobile-nav-link--active' : ''}`}
                onClick={() => handleNavClick('staff')}
              >
                <Shield size={18} aria-hidden="true" />
                <span>Staff Dashboard</span>
                <span className="nav-link__badge">Active</span>
              </button>
            )}
          </nav>

          <div className="mobile-role-section">
            <p className="mobile-role-heading">Demo Role Mode:</p>
            <RoleSwitcher
              currentRole={currentRole}
              onRoleChange={(role) => {
                onRoleChange(role);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </header>
  );
};
