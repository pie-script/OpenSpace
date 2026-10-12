import React, { useState, useMemo } from 'react';
import type { Venue, BookingRequest, Role, BookingStatus } from '../types';
import {
  findConflictsForRequest,
  checkApprovalEligibility,
} from '../utils/conflictDetection';
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
  AlertTriangle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Volume2,
} from 'lucide-react';

interface StaffDashboardPageProps {
  venues: Venue[];
  requests: BookingRequest[];
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onUpdateRequestStatus: (
    requestId: string,
    status: BookingStatus,
    staffNote?: string
  ) => void;
}

type TabFilter = 'all' | 'pending' | 'conflict' | 'approved' | 'declined' | 'cancelled';

interface ActionModalState {
  type: 'approve' | 'decline' | 'cancel' | 'note' | 'blocked_conflict';
  request: BookingRequest;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({
  venues,
  requests,
  currentRole,
  onRoleChange,
  onUpdateRequestStatus,
}) => {
  const isStaff = currentRole === 'staff';

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  // Map requests to conflict data for performance
  const requestsWithConflicts = useMemo(() => {
    return requests.map((req) => {
      const conflicts = findConflictsForRequest(req, requests);
      const hardConflict = conflicts.find((c) => c.isHardConflict);
      const softConflicts = conflicts.filter((c) => !c.isHardConflict);
      return {
        ...req,
        conflicts,
        hasHardConflict: Boolean(hardConflict),
        hardConflict,
        softConflicts,
      };
    });
  }, [requests]);

  // Metric counts
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const declinedCount = requests.filter((r) => r.status === 'Declined').length;
  const cancelledCount = requests.filter((r) => r.status === 'Cancelled').length;
  const conflictCount = requestsWithConflicts.filter(
    (r) => r.conflicts.length > 0 && r.status !== 'Cancelled' && r.status !== 'Declined'
  ).length;

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requestsWithConflicts.filter((req) => {
      // Tab filter
      if (activeTab === 'pending' && req.status !== 'Pending') return false;
      if (activeTab === 'approved' && req.status !== 'Approved') return false;
      if (activeTab === 'declined' && req.status !== 'Declined') return false;
      if (activeTab === 'cancelled' && req.status !== 'Cancelled') return false;
      if (activeTab === 'conflict') {
        if (req.conflicts.length === 0 || req.status === 'Cancelled' || req.status === 'Declined') {
          return false;
        }
      }

      // Venue filter
      if (selectedVenueId !== 'all' && req.venueId !== selectedVenueId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesEvent = req.eventName.toLowerCase().includes(query);
        const matchesOrg = req.organizerName.toLowerCase().includes(query);
        const matchesEmail = req.contactEmail.toLowerCase().includes(query);
        const matchesId = req.id.toLowerCase().includes(query);
        if (!matchesEvent && !matchesOrg && !matchesEmail && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [requestsWithConflicts, activeTab, selectedVenueId, searchQuery]);

  // Open modal handlers
  const handleOpenApproveModal = (req: BookingRequest) => {
    const eligibility = checkApprovalEligibility(req, requests);
    if (!eligibility.canApprove) {
      setActionModal({
        type: 'blocked_conflict',
        request: req,
      });
      return;
    }

    setNoteInput(req.staffNote || '');
    setActionModal({
      type: 'approve',
      request: req,
    });
  };

  const handleOpenDeclineModal = (req: BookingRequest) => {
    setNoteInput('');
    setActionModal({
      type: 'decline',
      request: req,
    });
  };

  const handleOpenCancelModal = (req: BookingRequest) => {
    setNoteInput('');
    setActionModal({
      type: 'cancel',
      request: req,
    });
  };

  const handleOpenNoteModal = (req: BookingRequest) => {
    setNoteInput(req.staffNote || '');
    setActionModal({
      type: 'note',
      request: req,
    });
  };

  const handleConfirmAction = () => {
    if (!actionModal) return;
    const { type, request } = actionModal;

    if (type === 'approve') {
      onUpdateRequestStatus(request.id, 'Approved', noteInput.trim() || undefined);
    } else if (type === 'decline') {
      onUpdateRequestStatus(
        request.id,
        'Declined',
        noteInput.trim() || 'Declined by institution staff.'
      );
    } else if (type === 'cancel') {
      onUpdateRequestStatus(
        request.id,
        'Cancelled',
        noteInput.trim() || 'Cancelled.'
      );
    } else if (type === 'note') {
      onUpdateRequestStatus(request.id, request.status, noteInput.trim() || undefined);
    }

    setActionModal(null);
    setNoteInput('');
  };

  const handleReopenAsPending = (req: BookingRequest) => {
    onUpdateRequestStatus(req.id, 'Pending', req.staffNote);
  };

  return (
    <div className="staff-page">
      <div className="section-container">
        {/* Role awareness banner if user is currently Organizer */}
        {!isStaff ? (
          <aside className="staff-role-alert" role="alert">
            <div className="staff-role-alert__icon">
              <Shield size={22} />
            </div>
            <div className="staff-role-alert__content">
              <h4>Viewing in Organizer Mode</h4>
              <p>
                You are currently in the <strong>Organizer</strong> role. You can inspect community
                booking request statuses and cancel requests. Switch to{' '}
                <strong>Institution Staff</strong> to test administrative approvals, declines, and
                custodial notes.
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
        ) : (
          <aside className="staff-role-active-alert" role="status">
            <div className="staff-role-active-alert__icon">
              <Shield size={20} />
            </div>
            <div className="staff-role-active-alert__content">
              <strong>Active Institution Staff Session</strong>
              <p>
                You have administrative authority to approve bookings, enforce campus security
                requirements, and prevent double-booked facilities outside academic hours.
              </p>
            </div>
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
              Manage community access to campus facilities outside academic hours. Review booking
              lifecycle requests, enforce safety policies, and detect schedule overlaps.
            </p>
          </div>

          <div className="page-header__badge">
            <Sparkles size={16} />
            <span>Active Role: {isStaff ? 'Institution Staff' : 'Organizer'}</span>
          </div>
        </header>

        {/* Quick stats grid */}
        <div className="stats-cards-grid" aria-label="Dashboard Metrics">
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
            <div className="stat-card__icon stat-card__icon--rose">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-card__data">
              <span className="stat-card__value">{conflictCount}</span>
              <span className="stat-card__label">Schedule Conflicts</span>
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

        {/* Requests Management Section */}
        <section className="dashboard-section" aria-labelledby="requests-section-heading">
          <div className="dashboard-section__header">
            <div>
              <h2 id="requests-section-heading" className="dashboard-section__title">
                Community Booking Requests & Lifecycle
              </h2>
              <p className="dashboard-section__subtitle">
                Review, approve, decline, or cancel requests. Overlap conflicts are automatically
                detected to prevent double-booking campus facilities.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="dashboard-filter-toolbar">
            <div className="dashboard-tabs" role="tablist" aria-label="Filter requests by status">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`dashboard-tab ${activeTab === 'all' ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({requests.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pending'}
                className={`dashboard-tab ${activeTab === 'pending' ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'conflict'}
                className={`dashboard-tab ${activeTab === 'conflict' ? 'dashboard-tab--active dashboard-tab--conflict' : ''}`}
                onClick={() => setActiveTab('conflict')}
              >
                <AlertTriangle size={13} />
                <span>Conflicts ({conflictCount})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'approved'}
                className={`dashboard-tab ${activeTab === 'approved' ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved ({approvedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'declined'}
                className={`dashboard-tab ${activeTab === 'declined' ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab('declined')}
              >
                Declined ({declinedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cancelled'}
                className={`dashboard-tab ${activeTab === 'cancelled' ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>

            <div className="dashboard-search-group">
              <div className="search-input-wrapper">
                <Search size={15} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search events, organizers, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  aria-label="Search requests"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="search-clear-btn"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="venue-select-wrapper">
                <Filter size={15} className="select-icon" aria-hidden="true" />
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="venue-select"
                  aria-label="Filter by venue space"
                >
                  <option value="all">All Venue Spaces</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.institutionName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          {filteredRequests.length === 0 ? (
            <div className="no-requests-box" role="status">
              <ClipboardList size={40} className="empty-icon" />
              <h3>No Requests Match Current Filter</h3>
              <p>Try switching filter tabs or clearing your search term.</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedVenueId('all');
                  setSearchQuery('');
                }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table" aria-label="Booking requests list">
                <thead>
                  <tr>
                    <th scope="col">Event & Organizer</th>
                    <th scope="col">Venue Space</th>
                    <th scope="col">Date & Time</th>
                    <th scope="col">Attendees / Noise</th>
                    <th scope="col">Status</th>
                    <th scope="col">Schedule Conflict Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const venue = venues.find((v) => v.id === req.venueId);
                    return (
                      <tr
                        key={req.id}
                        className={`request-row ${
                          req.hasHardConflict && req.status === 'Pending'
                            ? 'request-row--conflict-highlight'
                            : ''
                        }`}
                      >
                        <td>
                          <div className="request-event-cell">
                            <strong>{req.eventName}</strong>
                            <span className="request-organizer">
                              <User size={13} /> {req.organizerName}
                            </span>
                            <span className="request-email">{req.contactEmail}</span>
                            <span className="request-id-badge">ID: {req.id}</span>
                          </div>
                        </td>

                        <td>
                          <div className="request-venue-cell">
                            <span className="venue-cell-name">
                              {venue ? venue.name : req.venueId}
                            </span>
                            <small className="venue-cell-inst">{venue?.institutionName}</small>
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
                          <div className="request-specs-cell">
                            <span className="request-attendance">
                              <Users size={13} /> {req.attendance} guests
                            </span>
                            <span className="request-sound">
                              <Volume2 size={13} /> {req.soundLevel}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className={`status-pill status-pill--${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>

                        <td>
                          {/* Schedule Conflict Indicators */}
                          {req.status === 'Cancelled' || req.status === 'Declined' ? (
                            <span className="conflict-tag conflict-tag--resolved">
                              Slot Released
                            </span>
                          ) : req.hasHardConflict ? (
                            <div className="conflict-tag conflict-tag--hard" role="alert">
                              <AlertTriangle size={13} />
                              <div>
                                <strong>Conflict: Overlaps Approved</strong>
                                <small>
                                  "{req.hardConflict?.conflictingEventName}" (
                                  {req.hardConflict?.startTime}–{req.hardConflict?.endTime})
                                </small>
                              </div>
                            </div>
                          ) : req.softConflicts.length > 0 ? (
                            <div className="conflict-tag conflict-tag--soft">
                              <AlertTriangle size={13} />
                              <div>
                                <span>Competing Pending Request</span>
                                <small>
                                  "{req.softConflicts[0].conflictingEventName}" (
                                  {req.softConflicts[0].startTime}–{req.softConflicts[0].endTime})
                                </small>
                              </div>
                            </div>
                          ) : (
                            <span className="conflict-tag conflict-tag--clean">
                              <CheckCircle size={13} />
                              <span>No Conflict</span>
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="request-actions-cell">
                            {/* Actions for Pending Requests */}
                            {req.status === 'Pending' && (
                              <div className="actions-button-group">
                                <button
                                  type="button"
                                  className={`btn-action btn-action--approve ${
                                    !isStaff ? 'btn-action--disabled' : ''
                                  }`}
                                  onClick={() => handleOpenApproveModal(req)}
                                  disabled={!isStaff}
                                  title={
                                    !isStaff
                                      ? 'Switch to Institution Staff to approve'
                                      : req.hasHardConflict
                                      ? 'Conflict detected: Click to see conflict details'
                                      : 'Approve this community booking request'
                                  }
                                  aria-label={`Approve request for ${req.eventName}`}
                                >
                                  <Check size={14} />
                                  <span>Approve</span>
                                </button>

                                <button
                                  type="button"
                                  className={`btn-action btn-action--decline ${
                                    !isStaff ? 'btn-action--disabled' : ''
                                  }`}
                                  onClick={() => handleOpenDeclineModal(req)}
                                  disabled={!isStaff}
                                  title={
                                    !isStaff
                                      ? 'Switch to Institution Staff to decline'
                                      : 'Decline this booking request'
                                  }
                                  aria-label={`Decline request for ${req.eventName}`}
                                >
                                  <X size={14} />
                                  <span>Decline</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-action btn-action--cancel"
                                  onClick={() => handleOpenCancelModal(req)}
                                  title="Cancel this booking request"
                                  aria-label={`Cancel request for ${req.eventName}`}
                                >
                                  <span>Cancel</span>
                                </button>
                              </div>
                            )}

                            {/* Actions for Approved Bookings */}
                            {req.status === 'Approved' && (
                              <div className="actions-button-group">
                                <button
                                  type="button"
                                  className="btn-action btn-action--cancel"
                                  onClick={() => handleOpenCancelModal(req)}
                                  aria-label={`Cancel approved booking for ${req.eventName}`}
                                >
                                  <span>Cancel Booking</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-action btn-action--note"
                                  onClick={() => handleOpenNoteModal(req)}
                                  aria-label="View or edit staff note"
                                >
                                  <FileText size={13} />
                                  <span>Staff Note</span>
                                </button>
                              </div>
                            )}

                            {/* Actions for Declined or Cancelled */}
                            {(req.status === 'Declined' || req.status === 'Cancelled') && (
                              <div className="actions-button-group">
                                <button
                                  type="button"
                                  className="btn-action btn-action--reopen"
                                  onClick={() => handleReopenAsPending(req)}
                                  aria-label={`Reopen request for ${req.eventName} as pending`}
                                >
                                  <RotateCcw size={13} />
                                  <span>Reopen as Pending</span>
                                </button>
                                {req.staffNote && (
                                  <button
                                    type="button"
                                    className="btn-action btn-action--note"
                                    onClick={() => handleOpenNoteModal(req)}
                                    aria-label="View staff note"
                                  >
                                    <FileText size={13} />
                                    <span>View Note</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Staff Note Display if present */}
                            {req.staffNote && (
                              <div className="note-preview-pill" title={req.staffNote}>
                                <FileText size={11} />
                                <span>{req.staffNote}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Managed Campus Facilities Section */}
        <section className="dashboard-section" aria-labelledby="venues-section-heading">
          <div className="dashboard-section__header">
            <div>
              <h2 id="venues-section-heading" className="dashboard-section__title">
                Managed Campus Facilities
              </h2>
              <p className="dashboard-section__subtitle">
                Facilities configured with after-hours availability schedules and policy rules.
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

      {/* Action Dialog Modals */}
      {actionModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-modal-title"
        >
          <div className="modal-card modal-card--staff-action">
            <div className="modal-header">
              <h3 id="action-modal-title">
                {actionModal.type === 'approve' && 'Approve Community Booking'}
                {actionModal.type === 'decline' && 'Decline Booking Request'}
                {actionModal.type === 'cancel' && 'Cancel Booking'}
                {actionModal.type === 'note' && 'Staff Security & Facility Note'}
                {actionModal.type === 'blocked_conflict' && 'Approval Blocked: Schedule Conflict'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActionModal(null)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Blocked Conflict View */}
              {actionModal.type === 'blocked_conflict' ? (
                <div className="conflict-blocked-view">
                  <div className="conflict-blocked-icon">
                    <AlertTriangle size={36} />
                  </div>
                  <h4>Cannot Approve: Overlapping Booking Conflict</h4>
                  <p>
                    Approving <strong>{actionModal.request.eventName}</strong> would create an
                    overlapping double-booking with an already approved event at this facility.
                  </p>

                  <div className="conflict-details-card">
                    <div className="conflict-item conflict-item--target">
                      <span className="conflict-label">Request to Approve:</span>
                      <strong>{actionModal.request.eventName}</strong>
                      <small>
                        {actionModal.request.date} ({actionModal.request.startTime}–
                        {actionModal.request.endTime}) &bull; {actionModal.request.organizerName}
                      </small>
                    </div>

                    <div className="conflict-divider">&harr; Conflicting With &harr;</div>

                    {findConflictsForRequest(actionModal.request, requests)
                      .filter((c) => c.isHardConflict)
                      .map((conf) => (
                        <div key={conf.conflictingRequestId} className="conflict-item conflict-item--approved">
                          <span className="conflict-label">Already Approved Booking:</span>
                          <strong>{conf.conflictingEventName}</strong>
                          <small>
                            {conf.date} ({conf.startTime}–{conf.endTime}) &bull;{' '}
                            {conf.conflictingOrganizerName}
                          </small>
                        </div>
                      ))}
                  </div>

                  <p className="conflict-instruction">
                    To approve this request, the conflicting approved booking must be cancelled or
                    rescheduled first.
                  </p>
                </div>
              ) : (
                /* Standard Action Form */
                <>
                  <div className="action-event-summary">
                    <strong>{actionModal.request.eventName}</strong>
                    <p>
                      {actionModal.request.organizerName} &bull; {actionModal.request.date} (
                      {actionModal.request.startTime}–{actionModal.request.endTime})
                    </p>
                  </div>

                  {actionModal.type === 'approve' && (
                    <div className="action-guidance action-guidance--approve">
                      <CheckCircle size={18} />
                      <p>
                        This will mark the request as <strong>Approved</strong> and reserve this
                        facility slot. Any competing requests for the same time will be flagged as
                        conflicts.
                      </p>
                    </div>
                  )}

                  {actionModal.type === 'decline' && (
                    <div className="action-guidance action-guidance--decline">
                      <XCircle size={18} />
                      <p>
                        This will mark the request as <strong>Declined</strong> and release any
                        pending hold on this time slot.
                      </p>
                    </div>
                  )}

                  {actionModal.type === 'cancel' && (
                    <div className="action-guidance action-guidance--cancel">
                      <AlertTriangle size={18} />
                      <p>
                        This will cancel the booking and immediately release the venue time slot for
                        other community organizers.
                      </p>
                    </div>
                  )}

                  <div className="form-group form-group--full">
                    <label htmlFor="staff-note-input" className="form-label">
                      {actionModal.type === 'approve'
                        ? 'Staff Instructions / Keycard Note (Optional):'
                        : actionModal.type === 'decline'
                        ? 'Reason for Declining (Optional):'
                        : actionModal.type === 'cancel'
                        ? 'Reason for Cancellation (Optional):'
                        : 'Staff Facility Note:'}
                    </label>
                    <textarea
                      id="staff-note-input"
                      rows={3}
                      className="form-textarea"
                      placeholder={
                        actionModal.type === 'approve'
                          ? 'e.g., Keycard issued to organizer; custodian assigned for cleanup.'
                          : actionModal.type === 'decline'
                          ? 'e.g., Facility reserved for internal school rehearsal.'
                          : 'Enter notes or reason...'
                      }
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {actionModal.type === 'blocked_conflict' ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActionModal(null)}
                >
                  Understood
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActionModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn-primary ${
                      actionModal.type === 'decline' || actionModal.type === 'cancel'
                        ? 'btn-danger'
                        : ''
                    }`}
                    onClick={handleConfirmAction}
                  >
                    {actionModal.type === 'approve' && 'Confirm Approval'}
                    {actionModal.type === 'decline' && 'Confirm Decline'}
                    {actionModal.type === 'cancel' && 'Confirm Cancellation'}
                    {actionModal.type === 'note' && 'Save Note'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
