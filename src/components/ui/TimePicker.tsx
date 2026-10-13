import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  formatTime12Hour,
  parseTime24Hour,
  toTime24Hour,
  generateTimeSlots,
} from '../../utils/timeFormat';
import { timeToMinutes } from '../../utils/checkVenueFit';
import { Clock, ChevronDown, Check, X, Moon, Sun } from 'lucide-react';

interface TimePickerProps {
  id?: string;
  value: string; // HH:mm (24-hour)
  onChange: (value: string) => void;
  referenceStartTime?: string; // Optional start time to calculate duration
  minTime?: string;
  maxTime?: string;
  className?: string;
  ariaLabel?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  id,
  value,
  onChange,
  referenceStartTime,
  className = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'slots' | 'custom'>('slots');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value for custom picker
  const { hour12: curHour, minute: curMin, ampm: curAmPm } = useMemo(
    () => parseTime24Hour(value),
    [value]
  );

  const [customDraft, setCustomDraft] = useState<{
    hour: number;
    minute: number;
    ampm: 'AM' | 'PM';
  } | null>(null);

  const activeHour = customDraft ? customDraft.hour : curHour;
  const activeMinute = customDraft ? customDraft.minute : curMin;
  const activeAmPm = customDraft ? customDraft.ampm : curAmPm;

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Time slots for after-hours campus bookings
  const allSlots = useMemo(() => generateTimeSlots(8, 22, 30), []);

  const eveningSlots = useMemo(() => allSlots.filter((s) => s.isEvening), [allSlots]);
  const daySlots = useMemo(() => allSlots.filter((s) => !s.isEvening), [allSlots]);

  const handleSelectSlot = (time24: string) => {
    onChange(time24);
    setCustomDraft(null);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    const time24 = toTime24Hour(activeHour, activeMinute, activeAmPm);
    onChange(time24);
    setCustomDraft(null);
    setIsOpen(false);
  };

  // Calculate duration if referenceStartTime is provided
  const durationLabel = useMemo(() => {
    if (!referenceStartTime || !value) return null;
    const startMins = timeToMinutes(referenceStartTime);
    const endMins = timeToMinutes(value);
    const diff = endMins - startMins;
    if (diff <= 0) return null;
    const hrs = diff / 60;
    return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
  }, [referenceStartTime, value]);

  const displayTime = formatTime12Hour(value);

  return (
    <div className={`custom-time-picker-wrapper ${className}`} ref={containerRef}>
      {/* Hidden input to satisfy native form and label associations */}
      {id && (
        <input
          type="time"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />
      )}

      {/* Styled Interactive Trigger */}
      <button
        type="button"
        className={`time-picker-trigger ${isOpen ? 'time-picker-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || `Time: ${displayTime}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Clock size={15} className="time-picker-icon" aria-hidden="true" />
        <span className="time-picker-text">{displayTime}</span>
        {durationLabel && (
          <span className="time-duration-chip" title={`Duration: ${durationLabel}`}>
            {durationLabel}
          </span>
        )}
        <ChevronDown size={14} className="time-picker-chevron" aria-hidden="true" />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className="time-picker-popover"
          role="dialog"
          aria-label="Time selection picker"
        >
          {/* Popover Header */}
          <div className="time-picker-header">
            <div className="time-picker-header__info">
              <span className="header-title">Select Time</span>
              <span className="header-subtitle">{displayTime}</span>
            </div>

            <div className="time-picker-tabs" role="tablist">
              <button
                type="button"
                className={`tab-btn ${pickerTab === 'slots' ? 'tab-btn--active' : ''}`}
                onClick={() => setPickerTab('slots')}
              >
                Quick Slots
              </button>
              <button
                type="button"
                className={`tab-btn ${pickerTab === 'custom' ? 'tab-btn--active' : ''}`}
                onClick={() => setPickerTab('custom')}
              >
                Custom
              </button>
            </div>

            <button
              type="button"
              className="time-picker-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close time picker"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Slots Tab */}
          {pickerTab === 'slots' && (
            <div className="time-slots-container">
              {/* Evening Section (After-Hours focus) */}
              <div className="slots-section">
                <div className="slots-section-title">
                  <Moon size={12} />
                  <span>After-Hours & Evenings (17:00–22:00)</span>
                </div>
                <div className="slots-grid">
                  {eveningSlots.map((slot) => {
                    const isSelected = slot.time24 === value;
                    let diffBadge: string | null = null;
                    if (referenceStartTime) {
                      const diff = timeToMinutes(slot.time24) - timeToMinutes(referenceStartTime);
                      if (diff > 0) {
                        diffBadge = `+${diff / 60}h`;
                      }
                    }

                    return (
                      <button
                        type="button"
                        key={slot.time24}
                        className={`slot-chip ${isSelected ? 'slot-chip--selected' : ''}`}
                        onClick={() => handleSelectSlot(slot.time24)}
                      >
                        <span className="slot-main-time">{slot.time12}</span>
                        <div className="slot-details">
                          <small className="slot-24h">{slot.time24}</small>
                          {diffBadge && <span className="slot-diff">{diffBadge}</span>}
                        </div>
                        {isSelected && <Check size={13} className="slot-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day / Weekend Section */}
              <div className="slots-section">
                <div className="slots-section-title">
                  <Sun size={12} />
                  <span>Morning & Afternoon (08:00–16:30)</span>
                </div>
                <div className="slots-grid">
                  {daySlots.map((slot) => {
                    const isSelected = slot.time24 === value;
                    let diffBadge: string | null = null;
                    if (referenceStartTime) {
                      const diff = timeToMinutes(slot.time24) - timeToMinutes(referenceStartTime);
                      if (diff > 0) {
                        diffBadge = `+${diff / 60}h`;
                      }
                    }

                    return (
                      <button
                        type="button"
                        key={slot.time24}
                        className={`slot-chip ${isSelected ? 'slot-chip--selected' : ''}`}
                        onClick={() => handleSelectSlot(slot.time24)}
                      >
                        <span className="slot-main-time">{slot.time12}</span>
                        <div className="slot-details">
                          <small className="slot-24h">{slot.time24}</small>
                          {diffBadge && <span className="slot-diff">{diffBadge}</span>}
                        </div>
                        {isSelected && <Check size={13} className="slot-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Custom Time Tab */}
          {pickerTab === 'custom' && (
            <div className="custom-time-editor">
              <div className="custom-columns-row">
                {/* Hours column */}
                <div className="picker-col">
                  <span className="col-heading">Hour</span>
                  <div className="col-buttons-list">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                      <button
                        type="button"
                        key={h}
                        className={`col-item-btn ${activeHour === h ? 'col-item-btn--selected' : ''}`}
                        onClick={() =>
                          setCustomDraft((prev) => ({
                            hour: h,
                            minute: prev?.minute ?? curMin,
                            ampm: prev?.ampm ?? curAmPm,
                          }))
                        }
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes column */}
                <div className="picker-col">
                  <span className="col-heading">Minute</span>
                  <div className="col-buttons-list">
                    {[0, 15, 30, 45].map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`col-item-btn ${activeMinute === m ? 'col-item-btn--selected' : ''}`}
                        onClick={() =>
                          setCustomDraft((prev) => ({
                            hour: prev?.hour ?? curHour,
                            minute: m,
                            ampm: prev?.ampm ?? curAmPm,
                          }))
                        }
                      >
                        :{String(m).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM column */}
                <div className="picker-col">
                  <span className="col-heading">Period</span>
                  <div className="col-buttons-list">
                    {(['AM', 'PM'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        className={`col-item-btn ${activeAmPm === p ? 'col-item-btn--selected' : ''}`}
                        onClick={() =>
                          setCustomDraft((prev) => ({
                            hour: prev?.hour ?? curHour,
                            minute: prev?.minute ?? curMin,
                            ampm: p,
                          }))
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="custom-picker-footer">
                <span className="preview-label">
                  Selected: <strong>{`${String(activeHour).padStart(2, '0')}:${String(activeMinute).padStart(2, '0')} ${activeAmPm}`}</strong>
                </span>
                <button
                  type="button"
                  className="btn-apply-time"
                  onClick={handleApplyCustom}
                >
                  Apply Time
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
