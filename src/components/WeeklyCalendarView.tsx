import React, { useState, useMemo } from 'react';
import type { BookingRequest, Venue, Role, BookingStatus } from '../types';
import {
  getWeekDays,
  calculateTimelinePosition,
  formatWeekRangeLabel,
} from '../utils/calendarUtils';
import { findConflictsForRequest } from '../utils/conflictDetection';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  Filter,
} from 'lucide-react';

interface WeeklyCalendarViewProps {
  requests: BookingRequest[];
  venues: Venue[];
  currentRole: Role;
  initialDate?: string | Date;
  selectedVenueId?: string;
  onSelectVenueId?: (venueId: string) => void;
  onUpdateRequestStatus?: (
    requestId: string,
    status: BookingStatus,
    staffNote?: string
  ) => void;
}

const HOURS_LABELS = [
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
];

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  requests,
  venues,
  currentRole,
  initialDate,
  selectedVenueId = 'all',
  onSelectVenueId,
  onUpdateRequestStatus,
}) => {
  const isStaff = currentRole === 'staff';

  // Base date for current viewed week; defaults to October 19, 2026 (primary demo week)
  const [currentBaseDate, setCurrentBaseDate] = useState<Date>(() => {
    if (initialDate) {
      if (typeof initialDate === 'string') {
        const [y, m, d] = initialDate.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      return initialDate;
    }
    return new Date(2026, 9, 19);
  });

  const [activeVenueFilter, setActiveVenueFilter] = useState<string>(selectedVenueId);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

  const weekDays = useMemo(() => getWeekDays(currentBaseDate), [currentBaseDate]);
  const weekLabel = useMemo(() => formatWeekRangeLabel(weekDays), [weekDays]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setCurrentBaseDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentBaseDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    // Center on Oct 19, 2026 demo week
    setCurrentBaseDate(new Date(2026, 9, 19));
  };

  const handleVenueChange = (venueId: string) => {
    setActiveVenueFilter(venueId);
    onSelectVenueId?.(venueId);
  };

  // Filter requests for the week
  const visibleRequests = useMemo(() => {
    const weekIsoDates = new Set(weekDays.map((d) => d.isoDate));

    return requests.filter((req) => {
      if (!weekIsoDates.has(req.date)) return false;
      if (activeVenueFilter !== 'all' && req.venueId !== activeVenueFilter) return false;
      // Hide cancelled/declined to reduce clutter on active schedule, or show with muted styling
      return req.status !== 'Cancelled' && req.status !== 'Declined';
    });
  }, [requests, weekDays, activeVenueFilter]);

  // Map requests by date
  const requestsByDate = useMemo(() => {
    const map: Record<string, BookingRequest[]> = {};
    weekDays.forEach((d) => {
      map[d.isoDate] = [];
    });

    visibleRequests.forEach((req) => {
      if (map[req.date]) {
        map[req.date].push(req);
      }
    });

    return map;
  }, [visibleRequests, weekDays]);

  return (
    <div className="weekly-calendar-container" aria-label="Weekly Booking Schedule Timeline">
      {/* Calendar Header Controls */}
      <div className="weekly-calendar-header">
        <div className="calendar-nav-group">
          <div className="calendar-title-badge">
            <CalendarIcon size={18} />
            <span className="calendar-week-range">{weekLabel}</span>
          </div>

          <div className="calendar-nav-buttons">
            <button
              type="button"
              className="btn-calendar-nav"
              onClick={handlePrevWeek}
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
              <span>Previous Week</span>
            </button>
            <button
              type="button"
              className="btn-calendar-today"
              onClick={handleCurrentWeek}
            >
              Oct 2026 Demo Week
            </button>
            <button
              type="button"
              className="btn-calendar-nav"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              <span>Next Week</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Filters & Legend */}
        <div className="calendar-filter-group">
          <div className="calendar-venue-selector">
            <Filter size={14} className="selector-icon" aria-hidden="true" />
            <select
              value={activeVenueFilter}
              onChange={(e) => handleVenueChange(e.target.value)}
              className="calendar-select"
              aria-label="Filter schedule by facility"
            >
              <option value="all">All Campus Venues ({venues.length})</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.institutionName})
                </option>
              ))}
            </select>
          </div>

          <div className="calendar-legend-strip">
            <span className="legend-item legend-item--approved">
              <span className="legend-dot" /> Approved Booking
            </span>
            <span className="legend-item legend-item--pending">
              <span className="legend-dot" /> Pending Request
            </span>
            <span className="legend-item legend-item--conflict">
              <span className="legend-dot" /> Conflict Overlap
            </span>
          </div>
        </div>
      </div>

      {/* Grid Timeline */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-grid">
          {/* Time scale column */}
          <div className="calendar-time-axis" aria-hidden="true">
            <div className="time-axis-header">Hours</div>
            <div className="time-slots-column">
              {HOURS_LABELS.map((hour) => (
                <div key={hour} className="time-slot-label">
                  <span>{hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7 Days Columns */}
          <div className="calendar-days-columns">
            {weekDays.map((day) => {
              const dayRequests = requestsByDate[day.isoDate] || [];

              return (
                <div
                  key={day.isoDate}
                  className={`calendar-day-column ${day.isToday ? 'calendar-day-column--today' : ''}`}
                >
                  {/* Day Header */}
                  <div className="calendar-day-header">
                    <span className="day-name">{day.dayName}</span>
                    <span className="day-number">{day.dayNumber}</span>
                  </div>

                  {/* Day Timeline Area */}
                  <div className="day-timeline-content">
                    {/* Background gridlines */}
                    <div className="timeline-gridlines" aria-hidden="true">
                      {HOURS_LABELS.map((hour) => (
                        <div key={hour} className="timeline-gridline" />
                      ))}
                    </div>

                    {/* Events Layer */}
                    <div className="timeline-events-layer">
                      {dayRequests.map((req) => {
                        const venue = venues.find((v) => v.id === req.venueId);
                        const pos = calculateTimelinePosition(req.startTime, req.endTime, 8, 22);
                        const conflicts = findConflictsForRequest(req, requests);
                        const hasConflict = conflicts.length > 0;

                        return (
                          <button
                            type="button"
                            key={req.id}
                            className={`timeline-event-card timeline-event-card--${req.status.toLowerCase()} ${
                              hasConflict && req.status === 'Pending'
                                ? 'timeline-event-card--conflict'
                                : ''
                            }`}
                            style={{
                              top: `${pos.topPercent}%`,
                              height: `${pos.heightPercent}%`,
                            }}
                            onClick={() => setSelectedRequest(req)}
                            aria-label={`${req.eventName} (${req.startTime}–${req.endTime}) ${req.status}`}
                          >
                            <div className="event-card-header">
                              <span className="event-time">
                                <Clock size={11} /> {req.startTime}–{req.endTime}
                              </span>
                              {hasConflict && req.status === 'Pending' && (
                                <span className="event-conflict-icon" title="Schedule conflict detected">
                                  <AlertTriangle size={12} />
                                </span>
                              )}
                            </div>
                            <strong className="event-title">{req.eventName}</strong>
                            <span className="event-venue-name">{venue ? venue.name : req.venueId}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Event Details Modal / Popover */}
      {selectedRequest && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-popover-title"
        >
          <div className="modal-card modal-card--event-popover">
            <div className="modal-header">
              <div className="modal-title-group">
                <CalendarIcon size={20} className="modal-header-icon" />
                <div>
                  <h3 id="event-popover-title">{selectedRequest.eventName}</h3>
                  <p className="modal-subtitle">
                    {selectedRequest.date} &bull; {selectedRequest.startTime}–{selectedRequest.endTime}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="event-details-grid">
                <div className="event-detail-item">
                  <span className="detail-label">Status</span>
                  <span
                    className={`status-pill status-pill--${selectedRequest.status.toLowerCase()}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Venue</span>
                  <strong>
                    {venues.find((v) => v.id === selectedRequest.venueId)?.name ||
                      selectedRequest.venueId}
                  </strong>
                  <small>
                    {venues.find((v) => v.id === selectedRequest.venueId)?.institutionName}
                  </small>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Organizer</span>
                  <span>
                    <User size={13} /> {selectedRequest.organizerName}
                  </span>
                  <small>{selectedRequest.contactEmail}</small>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Expected Attendance</span>
                  <span>
                    <Users size={13} /> {selectedRequest.attendance} attendees
                  </span>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Noise Level</span>
                  <span>
                    <Volume2 size={13} /> {selectedRequest.soundLevel}
                  </span>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Event Category</span>
                  <span className="capitalize">{selectedRequest.eventType}</span>
                </div>
              </div>

              {/* Conflict notice if any */}
              {(() => {
                const conflicts = findConflictsForRequest(selectedRequest, requests);
                if (conflicts.length === 0) return null;
                const hardConflict = conflicts.find((c) => c.isHardConflict);

                return (
                  <div className="calendar-conflict-alert" role="alert">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Schedule Conflict Detected:</strong>
                      <p>
                        Overlaps with {hardConflict ? 'approved' : 'pending'} event "
                        {conflicts[0].conflictingEventName}" ({conflicts[0].startTime}–
                        {conflicts[0].endTime}) on {conflicts[0].date}.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {selectedRequest.staffNote && (
                <div className="event-staff-note-box">
                  <strong>Staff Note:</strong>
                  <p>{selectedRequest.staffNote}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>

              {/* Staff quick actions if applicable */}
              {isStaff && selectedRequest.status === 'Pending' && onUpdateRequestStatus && (
                <>
                  <button
                    type="button"
                    className="btn-action btn-action--decline"
                    onClick={() => {
                      onUpdateRequestStatus(
                        selectedRequest.id,
                        'Declined',
                        'Declined from calendar view.'
                      );
                      setSelectedRequest(null);
                    }}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="btn-action btn-action--approve"
                    onClick={() => {
                      onUpdateRequestStatus(selectedRequest.id, 'Approved');
                      setSelectedRequest(null);
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Booking</span>
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
