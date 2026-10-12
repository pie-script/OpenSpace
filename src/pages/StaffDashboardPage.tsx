import React from 'react';
import type { Venue, BookingRequest, Role } from '../types';
import {
  Shield,
  Building,
  ClipboardList,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  User,
  Users,
} from 'lucide-react';

interface StaffDashboardPageProps {
  venues: Venue[];
  requests: BookingRequest[];
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({
  venues,
  requests,
  currentRole,
  onRoleChange,
}) => {
  const isStaff = currentRole === 'staff';

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;

  return (
    <div className="staff-page">
      <div className="section-container">
        {/* Role awareness banner if user is currently Organizer */}
        {!isStaff && (
          <aside className="staff-role-alert" role="alert">
            <div className="staff-role-alert__icon">
              <Shield size={22} />
            </div>
            <div className="staff-role-alert__content">
              <h4>Viewing in Organizer Mode</h4>
              <p>
                You are currently in the <strong>Organizer</strong> role. Switch to{' '}
                <strong>Institution Staff</strong> to test administrative approvals and listing
                management.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => onRoleChange('staff')}
            >
              <ArrowRightLeft size={14} />
              <span>Switch to Institution Staff</span>
            </button>
          </aside>
        )}

        {/* Header */}
        <header className="page-header">
          <div className="page-header__content">
            <div className="header-tag">
              <Shield size={16} />
              <span>Institution Portal</span>
            </div>
            <h1 className="page-title">Institution Staff Dashboard</h1>
            <p className="page-subtitle">
              Manage school, university, and library spaces outside academic hours, review community
              event requests, and enforce campus safety rules.
            </p>
          </div>

          <div className="page-header__badge">
            <Sparkles size={16} />
            <span>Active Role: {isStaff ? 'Institution Staff' : 'Organizer'}</span>
          </div>
        </header>

        {/* Quick stats */}
        <div className="stats-cards-grid">
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--blue">
              <Building size={22} />
            </div>
            <div className="stat-card__data">
              <span className="stat-card__value">{venues.length}</span>
              <span className="stat-card__label">Managed Spaces</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--amber">
              <Clock size={22} />
            </div>
            <div className="stat-card__data">
              <span className="stat-card__value">{pendingCount}</span>
              <span className="stat-card__label">Pending Requests</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--emerald">
              <CheckCircle size={22} />
            </div>
            <div className="stat-card__data">
              <span className="stat-card__value">{approvedCount}</span>
              <span className="stat-card__label">Approved Bookings</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--purple">
              <ClipboardList size={22} />
            </div>
            <div className="stat-card__data">
              <span className="stat-card__value">{requests.length}</span>
              <span className="stat-card__label">Total Requests</span>
            </div>
          </div>
        </div>

        {/* Requests Queue Foundation */}
        <section className="dashboard-section" aria-labelledby="requests-section-heading">
          <div className="dashboard-section__header">
            <div>
              <h2 id="requests-section-heading" className="dashboard-section__title">
                Incoming Community Booking Requests
              </h2>
              <p className="dashboard-section__subtitle">
                Sample requests loaded from the local prototype database. (Interactive approvals activate
                in Phase 4).
              </p>
            </div>
          </div>

          <div className="requests-table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th scope="col">Event & Organizer</th>
                  <th scope="col">Venue Space</th>
                  <th scope="col">Date & Time</th>
                  <th scope="col">Attendees</th>
                  <th scope="col">Status</th>
                  <th scope="col">Staff Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const venue = venues.find((v) => v.id === req.venueId);
                  return (
                    <tr key={req.id}>
                      <td>
                        <div className="request-event-cell">
                          <strong>{req.eventName}</strong>
                          <span className="request-organizer">
                            <User size={13} /> {req.organizerName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="request-venue-cell">
                          <span>{venue ? venue.name : req.venueId}</span>
                          <small>{venue?.institutionName}</small>
                        </div>
                      </td>
                      <td>
                        <div className="request-date-cell">
                          <span>
                            <Calendar size={13} /> {req.date}
                          </span>
                          <small>
                            <Clock size={13} /> {req.startTime}–{req.endTime}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className="request-attendance">
                          <Users size={13} /> {req.attendance}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <span className="action-future-note">
                          {isStaff ? 'Ready for Phase 4 Approval' : 'Switch to Staff'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Managed Venues Overview */}
        <section className="dashboard-section" aria-labelledby="venues-section-heading">
          <div className="dashboard-section__header">
            <div>
              <h2 id="venues-section-heading" className="dashboard-section__title">
                Managed Campus Facilities
              </h2>
              <p className="dashboard-section__subtitle">
                Current sample venues configured with after-hours availability schedules and policy rules.
              </p>
            </div>
          </div>

          <div className="staff-venues-list">
            {venues.map((venue) => (
              <div key={venue.id} className="staff-venue-item">
                <div className="staff-venue-item__info">
                  <span className="staff-venue-item__inst">{venue.institutionName}</span>
                  <h3 className="staff-venue-item__name">{venue.name}</h3>
                  <p className="staff-venue-item__details">
                    <span>Capacity: {venue.capacity}</span> &bull;{' '}
                    <span>Rate: ${venue.hourlyPrice}/hr</span> &bull;{' '}
                    <span>
                      After-Hours: {venue.rules.weekdayHours.start}–{venue.rules.weekdayHours.end}
                    </span>
                  </p>
                </div>

                <div className="staff-venue-item__status">
                  <span className="status-pill status-pill--active">Active Listing</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
