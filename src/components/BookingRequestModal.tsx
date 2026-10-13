import React, { useState, useMemo } from 'react';
import type { Venue, EventParameters, BookingRequest } from '../types';
import { checkExistingApprovedBooking } from '../utils/conflictDetection';
import { timeToMinutes } from '../utils/checkVenueFit';
import {
  generateRecurringDates,
  checkRecurringSeriesAvailability,
} from '../utils/recurringUtils';
import {
  X,
  Calendar,
  Clock,
  Users,
  Volume2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Send,
  Building,
  FileText,
  Repeat,
} from 'lucide-react';

interface BookingRequestModalProps {
  venue: Venue;
  eventParams: EventParameters;
  existingRequests: BookingRequest[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: BookingRequest | BookingRequest[]) => void;
}

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({
  venue,
  eventParams,
  existingRequests,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [organizerName, setOrganizerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Recurring booking settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);

  const [submittedSingle, setSubmittedSingle] = useState<BookingRequest | null>(null);
  const [submittedBatch, setSubmittedBatch] = useState<BookingRequest[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate duration and estimated rental cost
  const startMins = timeToMinutes(eventParams.startTime);
  const endMins = timeToMinutes(eventParams.endTime);
  const durationHours = Math.max(0, (endMins - startMins) / 60);
  const sessionCost = Math.round(durationHours * venue.hourlyPrice);
  const totalOccurrences = isRecurring ? recurrenceCount : 1;
  const totalCost = sessionCost * totalOccurrences;

  // Single date conflict check
  const singleConflict = checkExistingApprovedBooking(
    venue.id,
    eventParams.date,
    eventParams.startTime,
    eventParams.endTime,
    existingRequests
  );

  // Recurring series dates and batch conflict check
  const recurringDates = useMemo(() => {
    if (!isRecurring) return [eventParams.date];
    return generateRecurringDates(eventParams.date, recurrenceFrequency, recurrenceCount);
  }, [isRecurring, eventParams.date, recurrenceFrequency, recurrenceCount]);

  const seriesCheck = useMemo(() => {
    return checkRecurringSeriesAvailability(
      venue.id,
      recurringDates,
      eventParams.startTime,
      eventParams.endTime,
      existingRequests
    );
  }, [venue.id, recurringDates, eventParams.startTime, eventParams.endTime, existingRequests]);

  const hasBlockingConflict = isRecurring ? seriesCheck.hasConflicts : Boolean(singleConflict);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!eventName.trim()) {
      setErrorMsg('Please provide a name for your event.');
      return;
    }
    if (!organizerName.trim()) {
      setErrorMsg('Please provide your name or organization name.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('Please provide a valid contact email address.');
      return;
    }

    if (isRecurring) {
      if (seriesCheck.hasConflicts) {
        const firstConflict = seriesCheck.occurrences.find((o) => o.hasConflict);
        setErrorMsg(
          `Cannot submit: Schedule conflict on ${firstConflict?.date} with "${firstConflict?.conflictingBooking?.eventName}". Please adjust your event parameters.`
        );
        return;
      }

      const seriesId = `series-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const batchRequests: BookingRequest[] = recurringDates.map((date, idx) => ({
        id: `req-${Date.now().toString(36)}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        venueId: venue.id,
        organizerName: organizerName.trim(),
        contactEmail: contactEmail.trim(),
        eventName: eventName.trim(),
        eventType: eventParams.eventType,
        date,
        startTime: eventParams.startTime,
        endTime: eventParams.endTime,
        attendance: eventParams.attendance,
        soundLevel: eventParams.soundLevel,
        status: 'Pending',
        staffNote: additionalNotes.trim() ? `Organizer Note: ${additionalNotes.trim()}` : undefined,
        createdAt: new Date().toISOString(),
        seriesId,
        recurrenceRule: `${recurrenceFrequency}-${recurrenceCount}`,
        occurrenceIndex: idx + 1,
        totalOccurrences: recurringDates.length,
      }));

      onSubmit(batchRequests);
      setSubmittedBatch(batchRequests);
    } else {
      if (singleConflict) {
        setErrorMsg(
          `Cannot submit: This time slot conflicts with approved booking "${singleConflict.eventName}". Please select a different time or date.`
        );
        return;
      }

      const newRequest: BookingRequest = {
        id: `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        venueId: venue.id,
        organizerName: organizerName.trim(),
        contactEmail: contactEmail.trim(),
        eventName: eventName.trim(),
        eventType: eventParams.eventType,
        date: eventParams.date,
        startTime: eventParams.startTime,
        endTime: eventParams.endTime,
        attendance: eventParams.attendance,
        soundLevel: eventParams.soundLevel,
        status: 'Pending',
        staffNote: additionalNotes.trim() ? `Organizer Note: ${additionalNotes.trim()}` : undefined,
        createdAt: new Date().toISOString(),
      };

      onSubmit(newRequest);
      setSubmittedSingle(newRequest);
    }
  };

  const handleFinish = () => {
    setSubmittedSingle(null);
    setSubmittedBatch(null);
    onClose();
  };

  const isConfirmed = Boolean(submittedSingle || submittedBatch);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="modal-card modal-card--booking">
        <div className="modal-header">
          <div className="modal-title-group">
            <Building size={20} className="modal-header-icon" aria-hidden="true" />
            <div>
              <h3 id="booking-modal-title">
                {isConfirmed
                  ? submittedBatch
                    ? 'Recurring Booking Series Submitted'
                    : 'Booking Request Submitted'
                  : `Request Booking: ${venue.name}`}
              </h3>
              <p className="modal-subtitle">
                {venue.institutionName} &bull; ${venue.hourlyPrice}/hr
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={isConfirmed ? handleFinish : onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {isConfirmed ? (
          /* Confirmation View */
          <div className="modal-body modal-success-state">
            <div className="modal-success-badge">
              <CheckCircle2 size={48} className="success-icon" />
            </div>

            {submittedBatch ? (
              <>
                <h4>Recurring Series Successfully Submitted!</h4>
                <p className="success-reference">
                  Series Reference: <strong>{submittedBatch[0].seriesId}</strong> ({submittedBatch.length} occurrences)
                </p>
                <p className="success-description">
                  Your recurring series for <strong>{submittedBatch[0].eventName}</strong> has been received with status{' '}
                  <span className="status-pill status-pill--pending">Pending</span> for staff review.
                </p>

                <div className="summary-card">
                  <div className="summary-row">
                    <span>Facility</span>
                    <strong>{venue.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Recurring Schedule</span>
                    <strong>
                      {submittedBatch.length} sessions ({eventParams.startTime}–{eventParams.endTime})
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Dates in Series</span>
                    <strong>
                      {submittedBatch.map((b) => b.date).join(', ')}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Total Estimated Rental</span>
                    <strong>
                      ${totalCost} ({submittedBatch.length} &times; ${sessionCost})
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Contact</span>
                    <strong>{submittedBatch[0].contactEmail}</strong>
                  </div>
                </div>
              </>
            ) : submittedSingle ? (
              <>
                <h4>Request Successfully Submitted!</h4>
                <p className="success-reference">
                  Reference ID: <strong>{submittedSingle.id}</strong>
                </p>
                <p className="success-description">
                  Your community booking request for <strong>{submittedSingle.eventName}</strong> has been
                  received with status <span className="status-pill status-pill--pending">Pending</span>.
                </p>

                <div className="summary-card">
                  <div className="summary-row">
                    <span>Facility</span>
                    <strong>{venue.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Institution</span>
                    <strong>{venue.institutionName}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Date & Time</span>
                    <strong>
                      {submittedSingle.date} ({submittedSingle.startTime}–{submittedSingle.endTime})
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Estimated Rental</span>
                    <strong>
                      ${sessionCost} ({durationHours} hours)
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>Contact</span>
                    <strong>{submittedSingle.contactEmail}</strong>
                  </div>
                </div>
              </>
            ) : null}

            <div className="modal-demo-guidance">
              <p>
                <strong>Testing in Demo Mode:</strong> Use the role switcher in the header to switch to{' '}
                <strong>Institution Staff</strong> to review, approve, or manage this request in the
                Staff Dashboard.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={handleFinish}
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* Booking Submission Form */
          <form onSubmit={handleSubmit} noValidate className="modal-form">
            <div className="modal-body modal-body--booking">
              {/* Event Parameter Summary Strip */}
              <div className="booking-review-strip" aria-label="Selected event parameters">
                <div className="review-stat">
                  <Calendar size={14} />
                  <span>{eventParams.date}</span>
                </div>
                <div className="review-stat">
                  <Clock size={14} />
                  <span>
                    {eventParams.startTime}–{eventParams.endTime} ({durationHours}h)
                  </span>
                </div>
                <div className="review-stat">
                  <Users size={14} />
                  <span>{eventParams.attendance} guests</span>
                </div>
                <div className="review-stat">
                  <Volume2 size={14} />
                  <span className="capitalize">{eventParams.soundLevel} sound</span>
                </div>
                <div className="review-stat review-stat--price">
                  <DollarSign size={14} />
                  <span>
                    ${totalCost} est. {isRecurring ? `(${recurrenceCount} sessions)` : ''}
                  </span>
                </div>
              </div>

              {/* Recurring Booking Options Section */}
              <div className="recurring-options-panel">
                <label className="checkbox-control">
                  <input
                    type="checkbox"
                    id="booking-recurring-checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span className="checkbox-label">
                    <Repeat size={14} aria-hidden="true" />
                    <strong>Repeat as a recurring booking series</strong>
                  </span>
                </label>

                {isRecurring && (
                  <div className="recurring-settings-grid">
                    <div className="form-group">
                      <label htmlFor="recurrence-frequency" className="form-label">
                        Frequency
                      </label>
                      <select
                        id="recurrence-frequency"
                        className="form-select"
                        value={recurrenceFrequency}
                        onChange={(e) => setRecurrenceFrequency(e.target.value as 'weekly' | 'biweekly')}
                      >
                        <option value="weekly">Weekly (Every 7 days)</option>
                        <option value="biweekly">Bi-weekly (Every 14 days)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="recurrence-count" className="form-label">
                        Number of Sessions
                      </label>
                      <select
                        id="recurrence-count"
                        className="form-select"
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                      >
                        <option value="2">2 sessions</option>
                        <option value="3">3 sessions</option>
                        <option value="4">4 sessions</option>
                        <option value="6">6 sessions</option>
                        <option value="8">8 sessions</option>
                      </select>
                    </div>

                    {/* Batch Date Availability Breakdown */}
                    <div className="recurring-dates-preview form-group--full">
                      <span className="dates-preview-title">
                        Series Availability Breakdown ({seriesCheck.availableCount}/{seriesCheck.totalCount} dates open):
                      </span>
                      <div className="occurrences-pills-list">
                        {seriesCheck.occurrences.map((occ) => (
                          <div
                            key={occ.date}
                            className={`occurrence-pill ${
                              occ.hasConflict ? 'occurrence-pill--conflict' : 'occurrence-pill--available'
                            }`}
                          >
                            <span className="occ-number">#{occ.occurrenceNumber}</span>
                            <span className="occ-date">{occ.formattedDate}</span>
                            {occ.hasConflict ? (
                              <span className="occ-status occ-status--conflict" title={`Conflict: ${occ.conflictingBooking?.eventName}`}>
                                Overlap: {occ.conflictingBooking?.eventName}
                              </span>
                            ) : (
                              <span className="occ-status occ-status--available">Available</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Conflict Status Banner */}
              {hasBlockingConflict ? (
                <div className="conflict-alert-banner" role="alert">
                  <AlertTriangle size={20} className="conflict-alert-icon" />
                  <div>
                    <strong>Schedule Conflict Detected</strong>
                    <p>
                      {isRecurring
                        ? `One or more dates in this series overlap with an already approved booking. Please adjust your start date or times.`
                        : `This venue is already approved for "${singleConflict?.eventName}" on ${singleConflict?.date} from ${singleConflict?.startTime} to ${singleConflict?.endTime}. Please adjust your event hours to avoid overlapping.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="slot-available-banner">
                  <CheckCircle2 size={16} />
                  <span>
                    {isRecurring
                      ? `All ${recurrenceCount} dates in this series are open with no approved schedule conflicts.`
                      : 'Schedule slot currently open. No approved conflicts on this date.'}
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="form-error-banner" role="alert">
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="form-grid">
                <div className="form-group form-group--full">
                  <label htmlFor="booking-event-name" className="form-label">
                    Event Title <span className="required-star">*</span>
                  </label>
                  <input
                    id="booking-event-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Neighborhood Youth Orchestra Rehearsal"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booking-organizer-name" className="form-label">
                    Organizer / Group Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="booking-organizer-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Jane Doe / Metro Arts Club"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="booking-contact-email" className="form-label">
                    Contact Email Address <span className="required-star">*</span>
                  </label>
                  <input
                    id="booking-contact-email"
                    type="email"
                    className="form-input"
                    placeholder="name@example.org"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="booking-notes" className="form-label">
                    Special Setup / Supervision Notes <span className="optional-tag">(Optional)</span>
                  </label>
                  <textarea
                    id="booking-notes"
                    className="form-textarea"
                    rows={2}
                    placeholder="Provide additional details regarding AV setup, equipment, or access needs..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Policy compliance reminders */}
              {venue.rules.requiresSupervision && (
                <div className="policy-note-box">
                  <FileText size={15} />
                  <span>
                    Note: {venue.institutionName} requires a certified staff custodian present
                    during this event window.
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={hasBlockingConflict}
              >
                <Send size={16} />
                <span>
                  {isRecurring ? `Submit Series (${recurrenceCount} Sessions)` : 'Submit Booking Request'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
