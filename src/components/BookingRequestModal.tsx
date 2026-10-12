import React, { useState } from 'react';
import type { Venue, EventParameters, BookingRequest } from '../types';
import { checkExistingApprovedBooking } from '../utils/conflictDetection';
import { timeToMinutes } from '../utils/checkVenueFit';
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
} from 'lucide-react';

interface BookingRequestModalProps {
  venue: Venue;
  eventParams: EventParameters;
  existingRequests: BookingRequest[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: BookingRequest) => void;
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
  const [submittedRequest, setSubmittedRequest] = useState<BookingRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate duration and estimated rental cost
  const startMins = timeToMinutes(eventParams.startTime);
  const endMins = timeToMinutes(eventParams.endTime);
  const durationHours = Math.max(0, (endMins - startMins) / 60);
  const estimatedCost = Math.round(durationHours * venue.hourlyPrice);

  // Check for conflict with existing approved bookings
  const conflictingApproved = checkExistingApprovedBooking(
    venue.id,
    eventParams.date,
    eventParams.startTime,
    eventParams.endTime,
    existingRequests
  );

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
    if (conflictingApproved) {
      setErrorMsg(
        `Cannot submit: This time slot conflicts with approved booking "${conflictingApproved.eventName}". Please select a different time or date.`
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
    setSubmittedRequest(newRequest);
  };

  const handleFinish = () => {
    setSubmittedRequest(null);
    onClose();
  };

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
                {submittedRequest ? 'Booking Request Submitted' : `Request Booking: ${venue.name}`}
              </h3>
              <p className="modal-subtitle">
                {venue.institutionName} &bull; ${venue.hourlyPrice}/hr
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={submittedRequest ? handleFinish : onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {submittedRequest ? (
          /* Confirmation View */
          <div className="modal-body modal-success-state">
            <div className="modal-success-badge">
              <CheckCircle2 size={48} className="success-icon" />
            </div>
            <h4>Request Successfully Submitted!</h4>
            <p className="success-reference">
              Reference ID: <strong>{submittedRequest.id}</strong>
            </p>
            <p className="success-description">
              Your community booking request for <strong>{submittedRequest.eventName}</strong> has been
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
                  {submittedRequest.date} ({submittedRequest.startTime}–{submittedRequest.endTime})
                </strong>
              </div>
              <div className="summary-row">
                <span>Estimated Rental</span>
                <strong>${estimatedCost} ({durationHours} hours)</strong>
              </div>
              <div className="summary-row">
                <span>Contact</span>
                <strong>{submittedRequest.contactEmail}</strong>
              </div>
            </div>

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
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
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
                  <span>${estimatedCost} est.</span>
                </div>
              </div>

              {/* Conflict Status Banner */}
              {conflictingApproved ? (
                <div className="conflict-alert-banner" role="alert">
                  <AlertTriangle size={20} className="conflict-alert-icon" />
                  <div>
                    <strong>Schedule Conflict Detected</strong>
                    <p>
                      This venue is already approved for "{conflictingApproved.eventName}" on{' '}
                      {conflictingApproved.date} from {conflictingApproved.startTime} to{' '}
                      {conflictingApproved.endTime}. Please adjust your event hours to avoid overlapping.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="slot-available-banner">
                  <CheckCircle2 size={16} />
                  <span>Schedule slot currently open. No approved conflicts on this date.</span>
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
                disabled={Boolean(conflictingApproved)}
              >
                <Send size={16} />
                <span>Submit Booking Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
