import React from 'react';
import type { Venue, Role } from '../types';
import {
  GraduationCap,
  Building2,
  BookOpen,
  MapPin,
  Users,
  Volume2,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface VenuesPageProps {
  venues: Venue[];
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const VenuesPage: React.FC<VenuesPageProps> = ({
  venues,
  currentRole,
}) => {
  return (
    <div className="venues-page">
      <div className="section-container">
        {/* Header */}
        <header className="page-header">
          <div className="page-header__content">
            <span className="section-eyebrow">Venue Directory</span>
            <h1 className="page-title">Browse Educational & Civic Spaces</h1>
            <p className="page-subtitle">
              Explore school auditoriums, athletic gyms, university lecture theatres, and public
              library meeting rooms available outside academic hours.
            </p>
          </div>

          <div className="page-header__badge">
            <Sparkles size={16} />
            <span>Showing {venues.length} Available Venues</span>
          </div>
        </header>

        {/* Phase Roadmap Note */}
        <div className="phase-indicator-card" role="region" aria-label="Phase status note">
          <div className="phase-indicator-card__icon">
            <ShieldCheck size={20} />
          </div>
          <div className="phase-indicator-card__text">
            <strong>Foundation View (Phase 1):</strong>
            <span>
              {' '}
              All sample venues are loaded from the separated demo data layer. Advanced multi-filter
              discovery, rules fit verification, and booking submissions will activate in subsequent
              phases.
            </span>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="venues-grid" aria-label="Sample venues catalog">
          {venues.map((venue) => (
            <article key={venue.id} className="venue-card" tabIndex={0}>
              <div className="venue-card__image-container">
                <img
                  src={venue.imageUrl}
                  alt={`Photograph of ${venue.name} at ${venue.institutionName}`}
                  className="venue-card__image"
                  loading="lazy"
                />
                <div className="venue-card__badge-row">
                  <span className="institution-badge">
                    {venue.institutionType === 'School' && <GraduationCap size={13} />}
                    {venue.institutionType === 'University' && <Building2 size={13} />}
                    {venue.institutionType === 'Library' && <BookOpen size={13} />}
                    <span>{venue.institutionType}</span>
                  </span>
                  <span className="availability-badge">
                    <Check size={12} /> Available
                  </span>
                </div>
              </div>

              <div className="venue-card__content">
                <div className="venue-card__institution">{venue.institutionName}</div>
                <h2 className="venue-card__name">{venue.name}</h2>

                <p className="venue-card__description">{venue.description}</p>

                {/* Key specs */}
                <div className="venue-card__specs">
                  <div className="spec-item" title="Address">
                    <MapPin size={15} aria-hidden="true" />
                    <span>
                      {venue.address}, {venue.city}
                    </span>
                  </div>

                  <div className="spec-item" title="Seated / room capacity">
                    <Users size={15} aria-hidden="true" />
                    <span>Max Capacity: {venue.capacity} attendees</span>
                  </div>

                  <div className="spec-item" title="Sound limit">
                    <Volume2 size={15} aria-hidden="true" />
                    <span>Permitted Sound: {venue.rules.maxSoundLevel}</span>
                  </div>

                  <div className="spec-item" title="Outside academic hours">
                    <Clock size={15} aria-hidden="true" />
                    <span>
                      Weekdays: {venue.rules.weekdayHours.start}–{venue.rules.weekdayHours.end}
                    </span>
                  </div>
                </div>

                {/* Facilities chips */}
                <div className="venue-card__facilities">
                  <span className="facilities-title">Key Facilities:</span>
                  <div className="facilities-list">
                    {venue.facilities.map((fac) => (
                      <span key={fac} className="facility-pill">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="venue-card__footer">
                  <div className="venue-card__price-tag">
                    <span className="price-currency">$</span>
                    <span className="price-value">{venue.hourlyPrice}</span>
                    <span className="price-period">/ hr</span>
                  </div>

                  <div className="venue-card__actions">
                    <span className="phase2-tag" title="Interactive booking request arrives in Phase 2 & 4">
                      {currentRole === 'organizer' ? 'Ready for Fit Check' : 'Managed Space'}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
