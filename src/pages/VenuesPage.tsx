import React from 'react';
import type { Venue, Role, VenueFilterState } from '../types';
import { VenueFilterBar } from '../components/VenueFilterBar';
import { filterVenues } from '../utils/filterVenues';
import {
  GraduationCap,
  Building2,
  BookOpen,
  MapPin,
  Users,
  Volume2,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  SearchX,
  Check,
} from 'lucide-react';

interface VenuesPageProps {
  venues: Venue[];
  currentRole: Role;
  onSelectVenue: (venueId: string) => void;
  filters: VenueFilterState;
  onFilterChange: (filters: VenueFilterState) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export const VenuesPage: React.FC<VenuesPageProps> = ({
  venues,
  currentRole,
  onSelectVenue,
  filters,
  onFilterChange,
  onResetFilters,
  isLoading = false,
}) => {
  const filteredVenues = filterVenues(venues, filters);

  return (
    <div className="venues-page">
      <div className="section-container">
        {/* Page Header */}
        <header className="page-header">
          <div className="page-header__content">
            <span className="section-eyebrow">
              Campus & Civic Directory • {currentRole === 'organizer' ? 'Organizer Mode' : 'Staff Mode'}
            </span>
            <h1 className="page-title">Browse Available Spaces</h1>
            <p className="page-subtitle">
              Discover school auditoriums, athletic pavilions, university seminar halls, and library
              atria available outside academic hours. Filter by event date, activity type, attendance,
              and equipment.
            </p>
          </div>

          <div className="page-header__badge">
            <Sparkles size={16} />
            <span>
              {filteredVenues.length} of {venues.length} Spaces Matching
            </span>
          </div>
        </header>

        {/* Filter Bar */}
        <VenueFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onResetFilters}
          totalVenues={venues.length}
          filteredCount={filteredVenues.length}
        />

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-state" role="status" aria-live="polite">
            <div className="spinner" />
            <p>Filtering campus venues...</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          /* Empty Results State */
          <div className="no-results-card" role="region" aria-label="No matching venues">
            <div className="no-results-icon-box">
              <SearchX size={44} aria-hidden="true" />
            </div>
            <h2 className="no-results-title">No Matching Campus Spaces Found</h2>
            <p className="no-results-text">
              We couldn’t find any school, university, or library spaces that match all your selected
              filter criteria.
            </p>
            <div className="no-results-tips">
              <h4>Helpful suggestions:</h4>
              <ul>
                <li>Try lowering your expected attendance requirement.</li>
                <li>Clear the target date to see all available operating days.</li>
                <li>Deselect one or more facility requirements.</li>
                <li>Switch event category to “All Event Types”.</li>
              </ul>
            </div>
            <button
              type="button"
              className="btn-primary btn-md"
              onClick={onResetFilters}
              aria-label="Reset all search filters"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          /* Venues Grid */
          <div className="venues-grid" aria-label="Matching venues catalog">
            {filteredVenues.map((venue) => (
              <article
                key={venue.id}
                className="venue-card"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectVenue(venue.id);
                }}
              >
                <div className="venue-card__image-container">
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
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

                    <div className="spec-item" title="Capacity">
                      <Users size={15} aria-hidden="true" />
                      <span>Capacity: up to {venue.capacity} attendees</span>
                    </div>

                    <div className="spec-item" title="Sound level">
                      <Volume2 size={15} aria-hidden="true" />
                      <span>Sound Limit: {venue.rules.maxSoundLevel}</span>
                    </div>

                    <div className="spec-item" title="After-hours schedule">
                      <Clock size={15} aria-hidden="true" />
                      <span>
                        Weekdays: {venue.rules.weekdayHours.start}–{venue.rules.weekdayHours.end}
                      </span>
                    </div>
                  </div>

                  {/* Facilities list */}
                  <div className="venue-card__facilities">
                    <span className="facilities-title">Key Facilities:</span>
                    <div className="facilities-list">
                      {venue.facilities.slice(0, 4).map((fac) => (
                        <span key={fac} className="facility-pill">
                          {fac}
                        </span>
                      ))}
                      {venue.facilities.length > 4 && (
                        <span className="facility-pill facility-chip--more">
                          +{venue.facilities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="venue-card__footer">
                    <div className="venue-card__price-tag">
                      <span className="price-currency">$</span>
                      <span className="price-value">{venue.hourlyPrice}</span>
                      <span className="price-period">/ hr</span>
                    </div>

                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onSelectVenue(venue.id)}
                      aria-label={`View details and rules for ${venue.name}`}
                    >
                      <span>View Details & Rules</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
