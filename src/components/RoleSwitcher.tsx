import React from 'react';
import type { Role } from '../types';
import { UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  compact?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  compact = false,
}) => {
  return (
    <div
      className={`role-switcher ${compact ? 'role-switcher--compact' : ''}`}
      role="group"
      aria-label="Demo mode role switcher"
    >
      <div className="role-switcher__header">
        <span className="role-switcher__badge" title="No real account required">
          <Sparkles size={13} aria-hidden="true" />
          <span>Demo Mode</span>
        </span>
        <span className="role-switcher__title">Active Role:</span>
      </div>

      <div className="role-switcher__buttons">
        <button
          type="button"
          className={`role-button ${currentRole === 'organizer' ? 'role-button--active' : ''}`}
          onClick={() => onRoleChange('organizer')}
          aria-pressed={currentRole === 'organizer'}
          aria-label="Switch to Organizer role"
        >
          <UserCheck size={16} aria-hidden="true" />
          <span className="role-button__text">
            <strong>Organizer</strong>
            {!compact && <small>Book & search</small>}
          </span>
        </button>

        <button
          type="button"
          className={`role-button ${currentRole === 'staff' ? 'role-button--active' : ''}`}
          onClick={() => onRoleChange('staff')}
          aria-pressed={currentRole === 'staff'}
          aria-label="Switch to Institution staff role"
        >
          <ShieldCheck size={16} aria-hidden="true" />
          <span className="role-button__text">
            <strong>Institution Staff</strong>
            {!compact && <small>Approve & manage</small>}
          </span>
        </button>
      </div>
    </div>
  );
};
