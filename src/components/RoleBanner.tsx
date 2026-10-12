import React from 'react';
import type { Role } from '../types';
import { UserCheck, ShieldCheck, ArrowRightLeft } from 'lucide-react';

interface RoleBannerProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const RoleBanner: React.FC<RoleBannerProps> = ({ currentRole, onRoleChange }) => {
  const isOrganizer = currentRole === 'organizer';

  return (
    <aside
      className={`role-banner ${isOrganizer ? 'role-banner--organizer' : 'role-banner--staff'}`}
      aria-label="Demo role status indicator"
    >
      <div className="role-banner__container">
        <div className="role-banner__content">
          <div className="role-banner__icon">
            {isOrganizer ? (
              <UserCheck size={18} aria-hidden="true" />
            ) : (
              <ShieldCheck size={18} aria-hidden="true" />
            )}
          </div>
          <div className="role-banner__text">
            <span className="role-banner__lead">
              <strong>Demo Mode: Active as {isOrganizer ? 'Organizer' : 'Institution Staff'}</strong>
            </span>
            <span className="role-banner__sub">
              {isOrganizer
                ? 'Discover after-hours educational spaces, inspect campus rules, and submit booking requests.'
                : 'Review incoming requests, manage campus facility policies, and authorize community bookings.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="role-banner__toggle-btn"
          onClick={() => onRoleChange(isOrganizer ? 'staff' : 'organizer')}
          aria-label={`Switch demo mode to ${isOrganizer ? 'Institution Staff' : 'Organizer'}`}
        >
          <ArrowRightLeft size={14} aria-hidden="true" />
          <span>Switch to {isOrganizer ? 'Institution Staff' : 'Organizer'}</span>
        </button>
      </div>
    </aside>
  );
};
