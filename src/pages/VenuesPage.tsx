import React, { useState } from 'react';
import type { Venue, Role, VenueFilterState, EventParameters } from '../types';
import { VenueFilterBar } from '../components/VenueFilterBar';
import { FitCheckerBar } from '../components/FitCheckerBar';
import { filterVenues } from '../utils/filterVenues';
import { checkVenueFit } from '../utils/checkVenueFit';
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface VenuesPageProps {
  venues: Venue[];
  currentRole: Role;
  onSelectVenue: (venueId: string) => void;
  filters: VenueFilterState;
  onFilterChange: (filters: VenueFilterState) => void;
  onResetFilters: () => void;
  eventParams: EventParameters;
  onEventParamsChange: (params: EventParameters) => void;
  onResetEventParams: () => void;
  isLoading?: boolean;
}

export const VenuesPage: React.FC<VenuesPageProps> = ({
  venues,
  currentRole,
  onSelectVenue,
  filters,
  onFilterChange,
  onResetFilters,
  eventParams,
  onEventParamsChange,
  onResetEventParams,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'fit' | 'filters'>('fit');

  const filteredVenues = filterVenues(venues, filters);

  // Compute fits for all venues
  const fitResults = new Map(venues.map((v) => [v.id, checkVenueFit(v, eventParams)]));

  const totalFitCount = venues.filter((v) => fitResults.get(v.id)?.isFit).length;
  const totalUnfitCount = venues.length - totalFitCount;

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
              spaces available outside academic hours. Configure your event parameters to evaluate
              per-venue policy fit and rule compatibility.
            </p>
          </div>

          <div className="page-header__badge">
            <Sparkles size={16} />
            <span>
              {filteredVenues.length} of {venues.length} Spaces Matching
            </span>
          </div>
        </header>

        {/* Tab Controls: Fit Checker vs General Filter */}
        <div className="discovery-tabs" role="tablist" aria-label="Discovery options">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fit'}
            className={`discovery-tab ${activeTab === 'fit' ? 'discovery-tab--active' : ''}`}
            onClick={() => setActiveTab('fit')}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>1. Policy Fit Evaluator ({totalFitCount} Fits)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'filters'}
            className={`discovery-tab ${activeTab === 'filters' ? 'discovery-tab--active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            <Sliders size={16} aria-hidden="true" />
            <span>2. Catalog Search & Amenities Filter</span>
          </button>
        </div>

        {/* Dynamic Panels */}
        {activeTab === 'fit' ? (
          <FitCheckerBar
            params={eventParams}
            onChange={onEventParamsChange}
            onReset={onResetEventParams}
            fitCount={totalFitCount}
            unfitCount={totalUnfitCount}
            totalCount={venues.length}
          />
        ) : (
          <VenueFilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onResetFilters}
            totalVenues={venues.length}
            filteredCount={filteredVenues.length}
          />
        )}

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
          /* Venues Grid with Fit Badges & Violations */
          <div className="venues-grid" aria-label="Matching venues catalog">
            {filteredVenues.map((venue) => {
              const fit = fitResults.get(venue.id) || {
                isFit: true,
                violations: [],
                conditions: [],
              };

              return (
                <article
                  key={venue.id}
                  className={`venue-card ${fit.isFit ? 'venue-card--fit' : 'venue-card--unfit'}`}
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

                    {/* Rule Fit Indicator Strip */}
                    <div
                      className={`card-fit-strip ${
                        fit.isFit ? 'card-fit-strip--success' : 'card-fit-strip--danger'
                      }`}
                      role="status"
                    >
                      <div className="card-fit-strip__header">
                        {fit.isFit ? (
                          <>
                            <CheckCircle2 size={16} className="card-fit-strip__icon" />
                            <strong>Compatible Fit</strong>
                            <span>— Meets all configured venue rules</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="card-fit-strip__icon" />
                            <strong>Policy Mismatch</strong>
                            <span>
                              — {fit.violations.length}{' '}
                              {fit.violations.length === 1 ? 'rule issue' : 'rule issues'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Specific Violations Explanations */}
                      {!fit.isFit && (
                        <ul className="card-fit-violations" aria-label="Rule mismatch reasons">
                          {fit.violations.map((v) => (
                            <li key={v.rule} className="card-fit-violation-item">
                              <span className="violation-bullet">•</span>
                              <span>
                                <strong>{v.title}:</strong> {v.explanation}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Required Conditions */}
                      {fit.isFit && fit.conditions.length > 0 && (
                        <div className="card-fit-conditions">
                          <AlertTriangle size={13} />
                          <span>Conditions: {fit.conditions.join('; ')}</span>
                        </div>
                      )}
                    </div>

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
                        className={`btn-sm ${fit.isFit ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => onSelectVenue(venue.id)}
                        aria-label={`View details and rules for ${venue.name}`}
                      >
                        <span>{fit.isFit ? 'Select & Check Fit' : 'Inspect Rules'}</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
