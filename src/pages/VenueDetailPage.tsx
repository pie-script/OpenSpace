import React, { useState } from 'react';
import type { Venue, Role } from '../types';
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
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  DollarSign,
  Send,
  X,
} from 'lucide-react';

interface VenueDetailPageProps {
  venue: Venue | undefined;
  currentRole: Role;
  onBack: () => void;
  onRoleChange: (role: Role) => void;
}

export const VenueDetailPage: React.FC<VenueDetailPageProps> = ({
  venue,
  currentRole,
  onBack,
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

              <button
                type="button"
                className="btn-primary btn-block btn-lg"
                onClick={() => setRequestModalOpen(true)}
                aria-label="Request to book this venue"
              >
                <Send size={18} aria-hidden="true" />
                <span>Request to Book Space</span>
              </button>

              <div className="booking-card__demo-hint">
                <Sparkles size={14} />
                <span>
                  Active Demo Mode ({currentRole === 'organizer' ? 'Organizer' : 'Institution Staff'}):
                  Request flow validates fit in Phase 3 & submits in Phase 4.
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

      {/* Interactive Request Information Modal (Phase 2 -> Phase 3/4 bridge) */}
      {requestModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <Sparkles size={20} className="modal-sparkle" />
                <h3 id="modal-title">Booking Request for {venue.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRequestModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                You are preparing to book <strong>{venue.name}</strong> at{' '}
                <strong>{venue.institutionName}</strong> ($ {venue.hourlyPrice}/hr).
              </p>
              <div className="modal-info-box">
                <h4>Phase Roadmap Preview:</h4>
                <ul>
                  <li>
                    <strong>Phase 2 (Current):</strong> Venue details, rules inspection, and filter
                    discovery are active.
                  </li>
                  <li>
                    <strong>Phase 3 (Next):</strong> Multi-parameter fit checking will validate your event
                    hours, attendance, and sound level against this venue’s rules before submission.
                  </li>
                  <li>
                    <strong>Phase 4:</strong> Submissions will appear directly in the Institution Staff
                    dashboard for approval.
                  </li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRequestModalOpen(false)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setRequestModalOpen(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
