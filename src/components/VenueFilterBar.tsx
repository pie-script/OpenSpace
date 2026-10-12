import React from 'react';
import type { VenueFilterState } from '../types';
import { COMMON_FACILITIES, getActiveFilterCount } from '../utils/filterVenues';
import { Filter, Calendar, Users, SlidersHorizontal, RotateCcw, Tag } from 'lucide-react';

interface VenueFilterBarProps {
  filters: VenueFilterState;
  onFilterChange: (filters: VenueFilterState) => void;
  onReset: () => void;
  totalVenues: number;
  filteredCount: number;
}

export const VenueFilterBar: React.FC<VenueFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalVenues,
  filteredCount,
}) => {
  const activeCount = getActiveFilterCount(filters);

  const handleFacilityToggle = (facility: string) => {
    const isSelected = filters.facilities.includes(facility);
    const updated = isSelected
      ? filters.facilities.filter((f) => f !== facility)
      : [...filters.facilities, facility];

    onFilterChange({
      ...filters,
      facilities: updated,
    });
  };

  return (
    <section className="filter-bar" aria-label="Venue Discovery Filters">
      <div className="filter-bar__top">
        <div className="filter-bar__title-group">
          <div className="filter-bar__icon-wrapper">
            <Filter size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="filter-bar__heading">Filter Available Spaces</h2>
            <p
              className="filter-bar__subheading"
              aria-label={`Showing ${filteredCount} of ${totalVenues} campus facilities`}
            >
              Showing <strong>{filteredCount}</strong> of {totalVenues} campus facilities
            </p>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="filter-bar__active-group">
            <span className="filter-active-pill">
              {activeCount} active {activeCount === 1 ? 'filter' : 'filters'}
            </span>
            <button
              type="button"
              className="btn-filter-reset"
              onClick={onReset}
              aria-label="Reset all filters"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      <div className="filter-grid">
        {/* Date Filter */}
        <div className="filter-field">
          <label htmlFor="filter-date" className="filter-label">
            <Calendar size={15} aria-hidden="true" />
            <span>Target Date</span>
          </label>
          <input
            id="filter-date"
            type="date"
            className="filter-input"
            value={filters.date}
            onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
            aria-label="Filter by date"
          />
        </div>

        {/* Event Type Filter */}
        <div className="filter-field">
          <label htmlFor="filter-event-type" className="filter-label">
            <Tag size={15} aria-hidden="true" />
            <span>Event Category</span>
          </label>
          <select
            id="filter-event-type"
            className="filter-select"
            value={filters.eventType}
            onChange={(e) => onFilterChange({ ...filters, eventType: e.target.value })}
            aria-label="Filter by event category"
          >
            <option value="all">All Event Types</option>
            <option value="meeting">Meeting / Board Retreat</option>
            <option value="workshop">Workshop / Training</option>
            <option value="rehearsal">Rehearsal / Practice</option>
            <option value="performance">Performance / Concert</option>
            <option value="sports">Sports / Athletics</option>
            <option value="community">Community Gathering</option>
            <option value="lecture">Lecture / Seminar</option>
          </select>
        </div>

        {/* Attendance Filter */}
        <div className="filter-field">
          <label htmlFor="filter-attendance" className="filter-label">
            <Users size={15} aria-hidden="true" />
            <span>Min. Attendance</span>
          </label>
          <input
            id="filter-attendance"
            type="number"
            min="1"
            max="1000"
            placeholder="e.g. 50 attendees"
            className="filter-input"
            value={filters.attendance}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
              onFilterChange({ ...filters, attendance: val });
            }}
            aria-label="Filter by minimum attendance"
          />
        </div>
      </div>

      {/* Facilities Multi-Select Chips */}
      <div className="filter-facilities-group">
        <span className="filter-facilities-label">
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Require Specific Facilities:</span>
        </span>
        <div className="facilities-chips-row" role="group" aria-label="Facility filter chips">
          {COMMON_FACILITIES.map((fac) => {
            const isSelected = filters.facilities.includes(fac);
            return (
              <button
                key={fac}
                type="button"
                className={`facility-filter-chip ${isSelected ? 'facility-filter-chip--active' : ''}`}
                onClick={() => handleFacilityToggle(fac)}
                aria-pressed={isSelected}
              >
                <span>{fac}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
