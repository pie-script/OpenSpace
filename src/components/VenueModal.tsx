import React, { useState } from 'react';
import type { Venue, InstitutionType, SoundLevel, EventType } from '../types';
import {
  X,
  Building,
  AlertTriangle,
  Plus,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { TimePicker } from './ui/TimePicker';

interface VenueModalProps {
  venue?: Venue | null; // If null/undefined, in "Create" mode; otherwise "Edit" mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (venue: Venue) => void;
}

const COMMON_FACILITIES = [
  'Wheelchair Accessible',
  'Free Parking',
  'WiFi',
  'PA Sound System',
  'Projector & 4K Screen',
  'Stage Lighting',
  'Changing Rooms',
  'Whiteboards',
  'Air Conditioning',
];

const PRESET_IMAGES = [
  { label: 'Auditorium / Theater', url: '/images/hero-venue.jpg' },
  { label: 'Indoor Gymnasium', url: '/images/gymnasium.jpg' },
  { label: 'Lecture / Lab Hall', url: '/images/lecture-hall.jpg' },
];

const ALL_EVENT_TYPES: { type: EventType; label: string }[] = [
  { type: 'meeting', label: 'Civic Meetings' },
  { type: 'workshop', label: 'Workshops & Classes' },
  { type: 'rehearsal', label: 'Music & Drama Rehearsal' },
  { type: 'performance', label: 'Stage Performances' },
  { type: 'sports', label: 'Indoor Sports & Athletics' },
  { type: 'community', label: 'Community Gatherings' },
  { type: 'lecture', label: 'Academic Lectures' },
];

const DAY_LABELS = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export const VenueModal: React.FC<VenueModalProps> = ({
  venue,
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(venue);

  // Form states
  const [name, setName] = useState(venue?.name || '');
  const [institutionName, setInstitutionName] = useState(venue?.institutionName || '');
  const [institutionType, setInstitutionType] = useState<InstitutionType>(
    venue?.institutionType || 'School'
  );
  const [description, setDescription] = useState(venue?.description || '');
  const [address, setAddress] = useState(venue?.address || '');
  const [city, setCity] = useState(venue?.city || '');
  const [capacity, setCapacity] = useState<number>(venue?.capacity || 100);
  const [hourlyPrice, setHourlyPrice] = useState<number>(venue?.hourlyPrice || 50);
  const [imageUrl, setImageUrl] = useState(venue?.imageUrl || '/images/hero-venue.jpg');
  const [facilities, setFacilities] = useState<string[]>(venue?.facilities || ['Wheelchair Accessible', 'WiFi']);
  const [newFacilityTag, setNewFacilityTag] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean>(venue?.isAvailable ?? true);

  // Rule states
  const [operatingDays, setOperatingDays] = useState<number[]>(
    venue?.rules.operatingDays || [1, 2, 3, 4, 5, 6]
  );
  const [weekdayStart, setWeekdayStart] = useState(venue?.rules.weekdayHours.start || '18:00');
  const [weekdayEnd, setWeekdayEnd] = useState(venue?.rules.weekdayHours.end || '22:00');
  const [weekendStart, setWeekendStart] = useState(venue?.rules.weekendHours.start || '09:00');
  const [weekendEnd, setWeekendEnd] = useState(venue?.rules.weekendHours.end || '22:00');
  const [maxDurationHours, setMaxDurationHours] = useState<number>(
    venue?.rules.maxDurationHours || 4
  );
  const [maxAttendance, setMaxAttendance] = useState<number>(
    venue?.rules.maxAttendance || venue?.capacity || 100
  );
  const [maxSoundLevel, setMaxSoundLevel] = useState<SoundLevel>(
    venue?.rules.maxSoundLevel || 'moderate'
  );
  const [allowedEventTypes, setAllowedEventTypes] = useState<EventType[]>(
    venue?.rules.allowedEventTypes || ['meeting', 'workshop', 'community']
  );
  const [requiresSupervision, setRequiresSupervision] = useState(
    venue?.rules.requiresSupervision || false
  );
  const [requiresCleanupDeposit, setRequiresCleanupDeposit] = useState(
    venue?.rules.requiresCleanupDeposit || false
  );
  const [notes, setNotes] = useState(venue?.rules.notes || '');

  const [activeTab, setActiveTab] = useState<'details' | 'rules'>('details');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Toggle helpers
  const handleToggleDay = (day: number) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter((d) => d !== day));
    } else {
      setOperatingDays([...operatingDays, day].sort());
    }
  };

  const handleToggleEventType = (type: EventType) => {
    if (allowedEventTypes.includes(type)) {
      setAllowedEventTypes(allowedEventTypes.filter((t) => t !== type));
    } else {
      setAllowedEventTypes([...allowedEventTypes, type]);
    }
  };

  const handleAddFacility = () => {
    const trimmed = newFacilityTag.trim();
    if (trimmed && !facilities.includes(trimmed)) {
      setFacilities([...facilities, trimmed]);
      setNewFacilityTag('');
    }
  };

  const handleRemoveFacility = (fac: string) => {
    setFacilities(facilities.filter((f) => f !== fac));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!name.trim()) {
      setErrorMsg('Please provide a name for the facility.');
      setActiveTab('details');
      return;
    }
    if (!institutionName.trim()) {
      setErrorMsg('Please specify the administering school, university, or library.');
      setActiveTab('details');
      return;
    }
    if (!address.trim() || !city.trim()) {
      setErrorMsg('Please provide the physical campus street address and city.');
      setActiveTab('details');
      return;
    }
    if (capacity <= 0) {
      setErrorMsg('Room capacity must be greater than zero.');
      setActiveTab('details');
      return;
    }
    if (hourlyPrice < 0) {
      setErrorMsg('Hourly rental rate cannot be negative.');
      setActiveTab('details');
      return;
    }
    if (operatingDays.length === 0) {
      setErrorMsg('Please select at least one day when after-hours access is permitted.');
      setActiveTab('rules');
      return;
    }
    if (allowedEventTypes.length === 0) {
      setErrorMsg('Please permit at least one community event activity type.');
      setActiveTab('rules');
      return;
    }

    const updatedVenue: Venue = {
      id: venue?.id || `venue-custom-${Date.now().toString(36)}`,
      name: name.trim(),
      institutionName: institutionName.trim(),
      institutionType,
      description: description.trim() || 'Community-accessible facility outside regular academic hours.',
      address: address.trim(),
      city: city.trim(),
      capacity: Number(capacity),
      hourlyPrice: Number(hourlyPrice),
      facilities,
      imageUrl,
      isAvailable,
      rules: {
        allowedEventTypes,
        operatingDays,
        weekdayHours: { start: weekdayStart, end: weekdayEnd },
        weekendHours: { start: weekendStart, end: weekendEnd },
        maxDurationHours: Number(maxDurationHours),
        maxAttendance: Number(maxAttendance),
        maxSoundLevel,
        requiresSupervision,
        requiresCleanupDeposit,
        notes: notes.trim() || undefined,
      },
    };

    onSave(updatedVenue);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-modal-title"
    >
      <div className="modal-card modal-card--venue-form">
        <div className="modal-header">
          <div className="modal-title-group">
            <Building size={20} className="modal-header-icon" />
            <div>
              <h3 id="venue-modal-title">
                {isEditing ? `Edit Facility: ${venue?.name}` : 'Add New Campus Facility'}
              </h3>
              <p className="modal-subtitle">
                Configure after-hours availability, rental rates, and safety rules.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="venue-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'details'}
            className={`venue-modal-tab ${activeTab === 'details' ? 'venue-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <Building size={15} />
            <span>1. Space Details & Rates</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rules'}
            className={`venue-modal-tab ${activeTab === 'rules' ? 'venue-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <ShieldAlert size={15} />
            <span>2. After-Hours Rules & Operating Times</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body modal-body--venue">
            {errorMsg && (
              <div className="form-error-banner" role="alert">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Tab 1: Space Details */}
            {activeTab === 'details' && (
              <div className="form-sections-stack">
                <div className="form-grid">
                  <div className="form-group form-group--full">
                    <label htmlFor="venue-name" className="form-label">
                      Facility / Space Name <span className="required-star">*</span>
                    </label>
                    <input
                      id="venue-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g., North Campus Amphitheater & Courtyard"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="venue-inst-name" className="form-label">
                      Institution Name <span className="required-star">*</span>
                    </label>
                    <input
                      id="venue-inst-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Oakridge Community High School"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="venue-inst-type" className="form-label">
                      Institution Type
                    </label>
                    <select
                      id="venue-inst-type"
                      className="form-select"
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                    >
                      <option value="School">School (K-12 / High School)</option>
                      <option value="University">University / College</option>
                      <option value="Library">Public Library / Civic Center</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="venue-address" className="form-label">
                      Street Address <span className="required-star">*</span>
                    </label>
                    <input
                      id="venue-address"
                      type="text"
                      className="form-input"
                      placeholder="e.g., 450 Oakridge Parkway"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="venue-city" className="form-label">
                      City <span className="required-star">*</span>
                    </label>
                    <input
                      id="venue-city"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Riverdale"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="venue-capacity" className="form-label">
                      Max Room Capacity (Guests) <span className="required-star">*</span>
                    </label>
                    <input
                      id="venue-capacity"
                      type="number"
                      min={1}
                      className="form-input"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="venue-hourly-price" className="form-label">
                      Hourly Rental Price ($/hr) <span className="required-star">*</span>
                    </label>
                    <input
                      id="venue-hourly-price"
                      type="number"
                      min={0}
                      className="form-input"
                      value={hourlyPrice}
                      onChange={(e) => setHourlyPrice(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label htmlFor="venue-description" className="form-label">
                      Facility Description
                    </label>
                    <textarea
                      id="venue-description"
                      rows={3}
                      className="form-textarea"
                      placeholder="Describe acoustic properties, court surface, seating setup, and intended community use..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Listing Image Presets */}
                <div className="form-sub-section">
                  <label className="form-label">Photo & Venue Image</label>
                  <div className="image-preset-grid">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.url}
                        className={`image-preset-card ${
                          imageUrl === preset.url ? 'image-preset-card--selected' : ''
                        }`}
                        onClick={() => setImageUrl(preset.url)}
                      >
                        <img src={preset.url} alt={preset.label} />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facilities / Amenities Tags */}
                <div className="form-sub-section">
                  <label className="form-label">Included Facilities & Amenities</label>
                  <div className="tags-container">
                    {facilities.map((fac) => (
                      <span key={fac} className="facility-edit-tag">
                        <span>{fac}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFacility(fac)}
                          aria-label={`Remove ${fac}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="tag-input-row">
                    <input
                      type="text"
                      className="form-input tag-input"
                      placeholder="Add custom amenity (e.g., Grand Piano, Soundboard)..."
                      value={newFacilityTag}
                      onChange={(e) => setNewFacilityTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFacility();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={handleAddFacility}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="preset-facility-chips">
                    <span className="chips-label">Quick Suggestions:</span>
                    {COMMON_FACILITIES.filter((f) => !facilities.includes(f)).map((f) => (
                      <button
                        type="button"
                        key={f}
                        className="chip-suggestion"
                        onClick={() => setFacilities([...facilities, f])}
                      >
                        + {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Availability Status */}
                <div className="form-sub-section availability-toggle-box">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                    />
                    <span>
                      <strong>Listing Active & Bookable</strong>
                      <small>
                        Uncheck to temporarily take facility offline (e.g., scheduled gym resurfacing or campus exams).
                      </small>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab 2: After-Hours Rules & Operating Times */}
            {activeTab === 'rules' && (
              <div className="form-sections-stack">
                {/* Operating Days */}
                <div className="form-sub-section">
                  <label className="form-label">
                    After-Hours Community Operating Days <span className="required-star">*</span>
                  </label>
                  <p className="form-help-text">
                    Select the days of the week when this campus facility permits outside community bookings.
                  </p>
                  <div className="days-checkbox-grid">
                    {DAY_LABELS.map(({ day, label }) => {
                      const isSelected = operatingDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          className={`day-toggle-btn ${isSelected ? 'day-toggle-btn--active' : ''}`}
                          onClick={() => handleToggleDay(day)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operating Hours Windows */}
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="weekday-start" className="form-label">
                      Weekday Start (After-School)
                    </label>
                    <TimePicker
                      id="weekday-start"
                      value={weekdayStart}
                      onChange={setWeekdayStart}
                      ariaLabel="Weekday start time"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="weekday-end" className="form-label">
                      Weekday End (Evening Curfew)
                    </label>
                    <TimePicker
                      id="weekday-end"
                      value={weekdayEnd}
                      referenceStartTime={weekdayStart}
                      onChange={setWeekdayEnd}
                      ariaLabel="Weekday curfew time"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="weekend-start" className="form-label">
                      Weekend Opening Time
                    </label>
                    <TimePicker
                      id="weekend-start"
                      value={weekendStart}
                      onChange={setWeekendStart}
                      ariaLabel="Weekend opening time"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="weekend-end" className="form-label">
                      Weekend Curfew Time
                    </label>
                    <TimePicker
                      id="weekend-end"
                      value={weekendEnd}
                      referenceStartTime={weekendStart}
                      onChange={setWeekendEnd}
                      ariaLabel="Weekend curfew time"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="max-duration" className="form-label">
                      Max Continuous Booking Duration (Hours)
                    </label>
                    <input
                      id="max-duration"
                      type="number"
                      min={1}
                      max={12}
                      className="form-input"
                      value={maxDurationHours}
                      onChange={(e) => setMaxDurationHours(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="rule-max-attendance" className="form-label">
                      Max Event Attendance Policy
                    </label>
                    <input
                      id="rule-max-attendance"
                      type="number"
                      min={1}
                      className="form-input"
                      value={maxAttendance}
                      onChange={(e) => setMaxAttendance(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label htmlFor="max-sound-level" className="form-label">
                      Sound & Decibel Policy Limit
                    </label>
                    <select
                      id="max-sound-level"
                      className="form-select"
                      value={maxSoundLevel}
                      onChange={(e) => setMaxSoundLevel(e.target.value as SoundLevel)}
                    >
                      <option value="low">Low (Acoustic / Library Speech Only)</option>
                      <option value="moderate">Moderate (Podium PA, Small Speakers, Practice)</option>
                      <option value="amplified">Amplified (Concert Audio, Live Bands, Stage Amps)</option>
                    </select>
                  </div>
                </div>

                {/* Allowed Event Activities */}
                <div className="form-sub-section">
                  <label className="form-label">
                    Permitted Event Activity Categories <span className="required-star">*</span>
                  </label>
                  <div className="event-types-checkbox-grid">
                    {ALL_EVENT_TYPES.map(({ type, label }) => {
                      const isAllowed = allowedEventTypes.includes(type);
                      return (
                        <label key={type} className="event-type-chip-label">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => handleToggleEventType(type)}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Supervision & Deposit Policies */}
                <div className="form-sub-section policy-switches-box">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={requiresSupervision}
                      onChange={(e) => setRequiresSupervision(e.target.checked)}
                    />
                    <span>
                      <strong>Requires Institutional Staff Custodian on Duty</strong>
                      <small>Mandatory security or custodial presence during outside-hours access.</small>
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={requiresCleanupDeposit}
                      onChange={(e) => setRequiresCleanupDeposit(e.target.checked)}
                    />
                    <span>
                      <strong>Requires Refundable Cleanup / Sound Deposit</strong>
                      <small>Organizers must deposit damage/cleanup bond held by bursar.</small>
                    </span>
                  </label>
                </div>

                {/* Special Campus Notes */}
                <div className="form-group form-group--full">
                  <label htmlFor="rule-notes" className="form-label">
                    Institutional Rules & Special Notes
                  </label>
                  <textarea
                    id="rule-notes"
                    rows={2}
                    className="form-textarea"
                    placeholder="e.g., No outdoor footwear on hardwood; science lab glassware cabinet is off-limits..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
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
            >
              <CheckCircle2 size={16} />
              <span>{isEditing ? 'Save Changes' : 'Publish Venue Listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
