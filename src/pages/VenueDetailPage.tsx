import React, { useState } from 'react';
import type { Venue, Role, EventParameters, BookingRequest } from '../types';
import { checkVenueFit } from '../utils/checkVenueFit';
import { BookingRequestModal } from '../components/BookingRequestModal';
import { WeeklyCalendarView } from '../components/WeeklyCalendarView';
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  BookOpen,
  MapPin,
  Users,
  Volume2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  DollarSign,
  Send,
  Tag,
  AlertTriangle,
} from 'lucide-react';

interface VenueDetailPageProps {
  venue: Venue | undefined;
  currentRole: Role;
  onBack: () => void;
  onRoleChange: (role: Role) => void;
  eventParams: EventParameters;
  onEventParamsChange: (params: EventParameters) => void;
  existingRequests?: BookingRequest[];
  onRequestSubmit?: (request: BookingRequest) => void;
}

export const VenueDetailPage: React.FC<VenueDetailPageProps> = ({
  venue,
  currentRole,
  onBack,
  eventParams,
  onEventParamsChange,
  existingRequests = [],
  onRequestSubmit,
}) => {
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Error State: Venue Not Found
  if (!venue) {
    return (
      <div className="section-container" style={{ padding: '4rem 1.5rem' }}>
        <div className="venue-not-found-card" role="alert">
          <AlertCircle size={48} className="venue-not-found-icon" />
          <h1 className="venue-not-found-title">Venue Not Found</h1>
          <p className="venue-not-found-text">
            The educational space you requested could not be located in the current database.
          </p>
          <button type="button" className="btn-primary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Return to Venue Directory</span>
          </button>
        </div>
      </div>
    );
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const operatingDayLabels = venue.rules.operatingDays.map((d) => dayNames[d]).join(', ');

  // Evaluate fit against this venue's specific rules
  const fitResult = checkVenueFit(venue, eventParams);

  return (
    <div className="venue-detail-page">
      <div className="section-container">
        {/* Back navigation */}
        <div className="venue-detail__nav">
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            aria-label="Back to venue directory"
          >
            <ArrowLeft size={16} />
            <span>Back to Venue Directory</span>
          </button>
        </div>

        {/* Hero Banner with Venue Photo */}
        <div className="venue-detail__hero">
          <div className="venue-detail__image-box">
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="venue-detail__image"
            />
            <div className="venue-detail__image-overlay">
              <span className="institution-badge">
                {venue.institutionType === 'School' && <GraduationCap size={14} />}
                {venue.institutionType === 'University' && <Building2 size={14} />}
                {venue.institutionType === 'Library' && <BookOpen size={14} />}
                <span>{venue.institutionType} Space</span>
              </span>
              <span className="availability-badge">
                <CheckCircle2 size={14} /> Available Outside Academic Hours
              </span>
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="venue-detail__grid">
          {/* Main Info */}
          <main className="venue-detail__main">
            <div className="venue-detail__header">
              <span className="venue-detail__inst">{venue.institutionName}</span>
              <h1 className="venue-detail__title">{venue.name}</h1>
              <div className="venue-detail__meta-strip">
                <span className="meta-pill">
                  <MapPin size={15} />
                  <span>
                    {venue.address}, {venue.city}
                  </span>
                </span>
                <span className="meta-pill">
                  <Users size={15} />
                  <span>Max Capacity: {venue.capacity} attendees</span>
                </span>
                <span className="meta-pill">
                  <DollarSign size={15} />
                  <span>${venue.hourlyPrice} / hour</span>
                </span>
              </div>
            </div>

            {/* Interactive Fit Checking Section */}
            <section
              className="detail-section fit-evaluation-section"
              aria-labelledby="fit-evaluator-title"
            >
              <div className="detail-section__header-flex">
                <h2 id="fit-evaluator-title" className="detail-section__title">
                  Event Rule & Policy Fit Evaluation
                </h2>
                <span
                  className={`fit-status-tag ${
                    fitResult.isFit ? 'fit-status-tag--fit' : 'fit-status-tag--unfit'
                  }`}
                >
                  {fitResult.isFit ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Fits This Space</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={15} />
                      <span>Not a Fit ({fitResult.violations.length} issues)</span>
                    </>
                  )}
                </span>
              </div>

              {/* Dynamic Fit Results Banner */}
              <div
                className={`fit-result-banner ${
                  fitResult.isFit ? 'fit-result-banner--fit' : 'fit-result-banner--unfit'
                }`}
                role="status"
              >
                {fitResult.isFit ? (
                  <div className="fit-result-banner__content">
                    <CheckCircle2 size={24} className="fit-result-banner__icon" />
                    <div>
                      <h4>✓ Your Event Meets All Rules for This Venue</h4>
                      <p>
                        Your schedule ({eventParams.startTime}–{eventParams.endTime}), attendance (
                        {eventParams.attendance}), and sound level ({eventParams.soundLevel}) fully comply
                        with {venue.institutionName}’s after-hours booking policy.
                      </p>
                      {fitResult.conditions.length > 0 && (
                        <div className="fit-result-conditions">
                          <strong>Required Conditions:</strong>
                          <ul>
                            {fitResult.conditions.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="fit-result-banner__content">
                    <XCircle size={24} className="fit-result-banner__icon" />
                    <div>
                      <h4>✕ Request Incompatible With Venue Policies</h4>
                      <p>
                        The event parameters you selected cannot be booked at {venue.name} due to the
                        following specific policy violations:
                      </p>
                      <ul className="fit-violations-list">
                        {fitResult.violations.map((v) => (
                          <li key={v.rule} className="fit-violation-item">
                            <strong>{v.title}:</strong> {v.explanation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Mini Fit Form to Test Rules Interactively */}
              <div className="fit-evaluator-controls">
                <h4 className="fit-evaluator-controls__title">
                  Adjust Event Parameters to Test Venue Compatibility:
                </h4>
                <div className="fit-controls-grid">
                  <div className="fit-control">
                    <label htmlFor="detail-event-type">
                      <Tag size={13} /> Activity:
                    </label>
                    <select
                      id="detail-event-type"
                      className="fit-control-input"
                      value={eventParams.eventType}
                      onChange={(e) =>
                        onEventParamsChange({
                          ...eventParams,
                          eventType: e.target.value as EventParameters['eventType'],
                        })
                      }
                    >
                      <option value="meeting">Meeting</option>
                      <option value="workshop">Workshop</option>
                      <option value="rehearsal">Rehearsal</option>
                      <option value="performance">Performance</option>
                      <option value="sports">Sports</option>
                      <option value="community">Community</option>
                      <option value="lecture">Lecture</option>
                    </select>
                  </div>

                  <div className="fit-control">
                    <label htmlFor="detail-date">
                      <Calendar size={13} /> Date:
                    </label>
                    <input
                      id="detail-date"
                      type="date"
                      className="fit-control-input"
                      value={eventParams.date}
                      onChange={(e) =>
                        onEventParamsChange({ ...eventParams, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="fit-control">
                    <label htmlFor="detail-start">
                      <Clock size={13} /> Start:
                    </label>
                    <input
                      id="detail-start"
                      type="time"
                      className="fit-control-input"
                      value={eventParams.startTime}
                      onChange={(e) =>
                        onEventParamsChange({ ...eventParams, startTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="fit-control">
                    <label htmlFor="detail-end">
                      <Clock size={13} /> End:
                    </label>
                    <input
                      id="detail-end"
                      type="time"
                      className="fit-control-input"
                      value={eventParams.endTime}
                      onChange={(e) =>
                        onEventParamsChange({ ...eventParams, endTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="fit-control">
                    <label htmlFor="detail-attendance">
                      <Users size={13} /> Attendance:
                    </label>
                    <input
                      id="detail-attendance"
                      type="number"
                      min="1"
                      className="fit-control-input"
                      value={eventParams.attendance}
                      onChange={(e) =>
                        onEventParamsChange({
                          ...eventParams,
                          attendance: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                    />
                  </div>

                  <div className="fit-control">
                    <label htmlFor="detail-sound">
                      <Volume2 size={13} /> Sound:
                    </label>
                    <select
                      id="detail-sound"
                      className="fit-control-input"
                      value={eventParams.soundLevel}
                      onChange={(e) =>
                        onEventParamsChange({
                          ...eventParams,
                          soundLevel: e.target.value as EventParameters['soundLevel'],
                        })
                      }
                    >
                      <option value="low">Low (Acoustic)</option>
                      <option value="moderate">Moderate</option>
                      <option value="amplified">Amplified</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="detail-section" aria-labelledby="about-space-title">
              <h2 id="about-space-title" className="detail-section__title">
                About This Educational Space
              </h2>
              <p className="detail-section__desc">{venue.description}</p>
            </section>

            {/* Amenities & Facilities */}
            <section className="detail-section" aria-labelledby="facilities-title">
              <h2 id="facilities-title" className="detail-section__title">
                Facilities & Equipment Provided
              </h2>
              <div className="facilities-grid">
                {venue.facilities.map((fac) => (
                  <div key={fac} className="facility-card">
                    <CheckCircle2 size={16} className="facility-card__icon" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Specific Campus Rules & Policies */}
            <section className="detail-section" aria-labelledby="rules-title">
              <div className="detail-section__header-flex">
                <h2 id="rules-title" className="detail-section__title">
                  Institution Rules & Usage Policies
                </h2>
                <span className="rules-verified-badge">
                  <ShieldCheck size={14} /> Institution Enforced
                </span>
              </div>

              <div className="rules-cards-grid">
                {/* Allowed Event Types */}
                <div className="rule-box">
                  <span className="rule-box__label">Permitted Event Types</span>
                  <div className="rule-event-tags">
                    {venue.rules.allowedEventTypes.map((t) => (
                      <span key={t} className="rule-event-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operating Schedule */}
                <div className="rule-box">
                  <span className="rule-box__label">Operating Outside Academic Hours</span>
                  <p className="rule-box__text">
                    <strong>Weekdays:</strong> {venue.rules.weekdayHours.start} –{' '}
                    {venue.rules.weekdayHours.end}
                  </p>
                  <p className="rule-box__text">
                    <strong>Weekends:</strong> {venue.rules.weekendHours.start} –{' '}
                    {venue.rules.weekendHours.end}
                  </p>
                  <p className="rule-box__subtext">
                    <Calendar size={13} /> Active Days: {operatingDayLabels}
                  </p>
                </div>

                {/* Sound Level & Duration */}
                <div className="rule-box">
                  <span className="rule-box__label">Sound Level & Duration Limits</span>
                  <p className="rule-box__text">
                    <Volume2 size={15} /> Permitted Sound: <strong>{venue.rules.maxSoundLevel}</strong>
                  </p>
                  <p className="rule-box__text">
                    <Clock size={15} /> Maximum Duration:{' '}
                    <strong>{venue.rules.maxDurationHours} hours</strong>
                  </p>
                </div>

                {/* Supervision & Deposit */}
                <div className="rule-box">
                  <span className="rule-box__label">Supervision & Care</span>
                  <p className="rule-box__text">
                    {venue.rules.requiresSupervision ? (
                      <span className="rule-condition rule-condition--required">
                        ✓ On-site campus supervisor required
                      </span>
                    ) : (
                      <span className="rule-condition">○ Self-managed entry</span>
                    )}
                  </p>
                  <p className="rule-box__text">
                    {venue.rules.requiresCleanupDeposit ? (
                      <span className="rule-condition rule-condition--required">
                        ✓ Refundable cleanup deposit required
                      </span>
                    ) : (
                      <span className="rule-condition">○ Standard cleaning policy</span>
                    )}
                  </p>
                </div>
              </div>

              {venue.rules.notes && (
                <div className="campus-note-card">
                  <Info size={18} className="campus-note-card__icon" />
                  <div>
                    <strong>Campus Notes:</strong> {venue.rules.notes}
                  </div>
                </div>
              )}
            </section>

            {/* Weekly Schedule Timeline */}
            <section className="detail-section" aria-labelledby="venue-schedule-title">
              <h2 id="venue-schedule-title" className="detail-section__title">
                Weekly Schedule & Facility Availability
              </h2>
              <p className="detail-section__subtitle">
                Visual timeline showing booked community slots and after-hours availability for this space.
              </p>
              <WeeklyCalendarView
                requests={existingRequests}
                venues={[venue]}
                currentRole={currentRole}
                selectedVenueId={venue.id}
              />
            </section>
          </main>

          {/* Booking Request Sidebar */}
          <aside className="venue-detail__sidebar" aria-label="Booking Request Summary">
            <div className="booking-card">
              <div className="booking-card__price-row">
                <div>
                  <span className="booking-price">${venue.hourlyPrice}</span>
                  <span className="booking-period"> / hour</span>
                </div>
                <span className="rate-badge">Community Rate</span>
              </div>

              <div className="booking-card__specs">
                <div className="booking-spec-row">
                  <span>Capacity</span>
                  <strong>Up to {venue.capacity} attendees</strong>
                </div>
                <div className="booking-spec-row">
                  <span>Permitted Sound</span>
                  <strong>{venue.rules.maxSoundLevel}</strong>
                </div>
                <div className="booking-spec-row">
                  <span>Max Duration</span>
                  <strong>{venue.rules.maxDurationHours} hours</strong>
                </div>
              </div>

              {/* Fit Summary Badge in Sidebar */}
              <div
                className={`sidebar-fit-notice ${
                  fitResult.isFit ? 'sidebar-fit-notice--fit' : 'sidebar-fit-notice--unfit'
                }`}
              >
                {fitResult.isFit ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Meets all venue policies</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    <span>Incompatible with event parameters</span>
                  </>
                )}
              </div>

              <button
                type="button"
                className={`btn-block btn-lg ${
                  fitResult.isFit ? 'btn-primary' : 'btn-secondary btn-blocked'
                }`}
                onClick={() => setRequestModalOpen(true)}
                aria-label="Request to book this venue"
              >
                <Send size={18} aria-hidden="true" />
                <span>
                  {fitResult.isFit ? 'Request to Book Space' : 'Request Blocked by Rules'}
                </span>
              </button>

              <div className="booking-card__demo-hint">
                <Sparkles size={14} />
                <span>
                  Active Demo Mode ({currentRole === 'organizer' ? 'Organizer' : 'Institution Staff'}):
                  Submitting creates a live Pending request for staff approval and conflict detection.
                </span>
              </div>

              <div className="booking-card__institution-box">
                <h4>Administered by:</h4>
                <p>
                  <strong>{venue.institutionName}</strong>
                </p>
                <p className="sidebar-inst-address">{venue.address}</p>
                <p className="sidebar-inst-note">
                  Facilities staff inspect community bookings outside regular academic hours.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Interactive Booking Request Modal (Phase 4) */}
      <BookingRequestModal
        venue={venue}
        eventParams={eventParams}
        existingRequests={existingRequests}
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={(request) => {
          onRequestSubmit?.(request);
        }}
      />
    </div>
  );
};
