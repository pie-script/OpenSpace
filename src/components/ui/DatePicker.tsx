import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X, Sparkles } from 'lucide-react';

interface DatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  minDate?: string;
  placeholder?: string;
  allowClear?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  className = '',
  ariaLabel,
  placeholder,
  allowClear = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable reference for today's date string
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  // Parse current value
  const parsedValueDate = useMemo(() => {
    if (!value || !value.includes('-')) return new Date(2026, 9, 27);
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  // Current viewed month and year in calendar (defaults to parsed value)
  const [navOverride, setNavOverride] = useState<{ year: number; month: number } | null>(null);

  const viewYear = navOverride ? navOverride.year : parsedValueDate.getFullYear();
  const viewMonth = navOverride ? navOverride.month : parsedValueDate.getMonth();

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

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setNavOverride({ year: viewYear - 1, month: 11 });
    } else {
      setNavOverride({ year: viewYear, month: viewMonth - 1 });
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setNavOverride({ year: viewYear + 1, month: 0 });
    } else {
      setNavOverride({ year: viewYear, month: viewMonth + 1 });
    }
  };

  // Build grid days for viewed month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);

    // Monday is 0, Sunday is 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dNum);
      const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(dNum).padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isSelected: dateStr === value,
        isToday: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateStr = `${viewYear}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isSelected: dateStr === value,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill complete rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isSelected: dateStr === value,
        isToday: false,
      });
    }

    return days;
  }, [viewYear, viewMonth, value, todayStr]);

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setNavOverride(null);
    setIsOpen(false);
  };

  const handleShortcut = (targetDate: Date) => {
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    onChange(dateStr);
    setNavOverride({ year: y, month: targetDate.getMonth() });
    setIsOpen(false);
  };

  // Format date for button display: "Tue, Oct 27, 2026"
  const formattedDisplay = useMemo(() => {
    if (!value || !value.includes('-')) return placeholder || 'Select date';
    try {
      const [y, m, d] = value.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      return dObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return value || placeholder || 'Select date';
    }
  }, [value, placeholder]);

  return (
    <div className={`custom-date-picker-wrapper ${className}`} ref={containerRef}>
      {/* Hidden input to satisfy native form associations */}
      {id && (
        <input
          type="date"
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
        className={`date-picker-trigger ${isOpen ? 'date-picker-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || `Date: ${formattedDisplay}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarIcon size={15} className="date-picker-icon" aria-hidden="true" />
        <span className="date-picker-text">{formattedDisplay}</span>
        <ChevronDown size={14} className="date-picker-chevron" aria-hidden="true" />
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className="date-picker-popover"
          role="dialog"
          aria-label="Date selection calendar"
        >
          {/* Header Controls */}
          <div className="date-picker-header">
            <div className="date-picker-header__nav">
              <button
                type="button"
                className="btn-month-nav"
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="current-month-label">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                className="btn-month-nav"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              className="date-picker-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close calendar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="date-shortcuts-bar">
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => handleShortcut(new Date(2026, 9, 24))} // Sat Oct 24, 2026
            >
              <Sparkles size={11} />
              <span>Oct 24 Demo Sat</span>
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => handleShortcut(new Date(2026, 9, 27))} // Tue Oct 27, 2026
            >
              <span>Oct 27 Tue</span>
            </button>
            <button
              type="button"
              className="shortcut-chip"
              onClick={() => handleShortcut(new Date())}
            >
              <span>Today</span>
            </button>
          </div>

          {/* 7-Day Header */}
          <div className="calendar-weekdays-row" aria-hidden="true">
            {DAY_LABELS.map((label) => (
              <span key={label} className="weekday-label">
                {label}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid" role="grid">
            {calendarDays.map((day) => (
              <button
                type="button"
                key={day.dateStr}
                className={`calendar-day-btn ${
                  !day.isCurrentMonth ? 'calendar-day-btn--outside' : ''
                } ${day.isSelected ? 'calendar-day-btn--selected' : ''} ${
                  day.isToday ? 'calendar-day-btn--today' : ''
                }`}
                onClick={() => handleSelectDay(day.dateStr)}
                aria-label={`${day.dateStr}${day.isSelected ? ' (selected)' : ''}`}
                aria-pressed={day.isSelected}
              >
                <span className="day-number-text">{day.dayNumber}</span>
              </button>
            ))}
          </div>

          {/* Popover Footer */}
          <div className="date-picker-footer">
            <div className="date-picker-footer__left">
              {allowClear && Boolean(value) && (
                <button
                  type="button"
                  className="btn-date-clear"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  aria-label="Clear date filter"
                >
                  Clear
                </button>
              )}
              <span className="footer-selected-date">{formattedDisplay}</span>
            </div>
            <button
              type="button"
              className="btn-today-action"
              onClick={() => handleShortcut(new Date())}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
