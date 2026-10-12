import React from 'react';
import type { EventParameters } from '../types';
import {
  Calendar,
  Clock,
  Users,
  Volume2,
  Tag,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface FitCheckerBarProps {
  params: EventParameters;
  onChange: (params: EventParameters) => void;
  onReset: () => void;
  fitCount: number;
  unfitCount: number;
  totalCount: number;
}

export const FitCheckerBar: React.FC<FitCheckerBarProps> = ({
  params,
  onChange,
  onReset,
  fitCount,
  unfitCount,
  totalCount,
}) => {
  return (
    <section className="fit-checker-bar" aria-label="Campus Policy Fit Evaluator">
      <div className="fit-checker-bar__header">
        <div className="fit-checker-bar__title-group">
          <div className="fit-checker-bar__icon">
            <Sparkles size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="fit-checker-bar__title">Campus Policy & Rule Fit Evaluator</h2>
            <p className="fit-checker-bar__subtitle">
              Enter your event parameters below to evaluate fit against each institution’s
              after-hours operating rules, noise limits, and capacity.
            </p>
          </div>
        </div>

        <div className="fit-checker-bar__stats">
          <span className="fit-stat fit-stat--match" title="Spaces compatible with all rules">
            <CheckCircle2 size={15} />
            <strong>{fitCount}</strong> / {totalCount} Fits
          </span>
          <span className="fit-stat fit-stat--unfit" title="Spaces failing one or more rules">
            <XCircle size={15} />
            <strong>{unfitCount}</strong> Incompatible
          </span>
          <button
            type="button"
            className="btn-fit-reset"
            onClick={onReset}
            aria-label="Reset fit checking parameters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="fit-checker-bar__grid">
        {/* Event Type */}
        <div className="fit-checker-field">
          <label htmlFor="fit-event-type" className="fit-checker-label">
            <Tag size={14} aria-hidden="true" />
            <span>Event Activity</span>
          </label>
          <select
            id="fit-event-type"
            className="fit-checker-select"
            value={params.eventType}
            onChange={(e) =>
              onChange({ ...params, eventType: e.target.value as EventParameters['eventType'] })
            }
            aria-label="Event activity type"
          >
            <option value="meeting">Meeting / Board Retreat</option>
            <option value="workshop">Workshop / Training</option>
            <option value="rehearsal">Rehearsal / Practice</option>
            <option value="performance">Performance / Concert</option>
            <option value="sports">Sports / Athletics</option>
            <option value="community">Community Gathering</option>
            <option value="lecture">Lecture / Seminar</option>
          </select>
        </div>

        {/* Date */}
        <div className="fit-checker-field">
          <label htmlFor="fit-date" className="fit-checker-label">
            <Calendar size={14} aria-hidden="true" />
            <span>Event Date</span>
          </label>
          <input
            id="fit-date"
            type="date"
            className="fit-checker-input"
            value={params.date}
            onChange={(e) => onChange({ ...params, date: e.target.value })}
            aria-label="Event date"
          />
        </div>

        {/* Start Time */}
        <div className="fit-checker-field">
          <label htmlFor="fit-start-time" className="fit-checker-label">
            <Clock size={14} aria-hidden="true" />
            <span>Start Time</span>
          </label>
          <input
            id="fit-start-time"
            type="time"
            className="fit-checker-input"
            value={params.startTime}
            onChange={(e) => onChange({ ...params, startTime: e.target.value })}
            aria-label="Event start time"
          />
        </div>

        {/* End Time */}
        <div className="fit-checker-field">
          <label htmlFor="fit-end-time" className="fit-checker-label">
            <Clock size={14} aria-hidden="true" />
            <span>End Time</span>
          </label>
          <input
            id="fit-end-time"
            type="time"
            className="fit-checker-input"
            value={params.endTime}
            onChange={(e) => onChange({ ...params, endTime: e.target.value })}
            aria-label="Event end time"
          />
        </div>

        {/* Attendance */}
        <div className="fit-checker-field">
          <label htmlFor="fit-attendance" className="fit-checker-label">
            <Users size={14} aria-hidden="true" />
            <span>Expected Attendance</span>
          </label>
          <input
            id="fit-attendance"
            type="number"
            min="1"
            max="1000"
            className="fit-checker-input"
            value={params.attendance}
            onChange={(e) =>
              onChange({ ...params, attendance: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
            aria-label="Expected attendance"
          />
        </div>

        {/* Sound Level */}
        <div className="fit-checker-field">
          <label htmlFor="fit-sound-level" className="fit-checker-label">
            <Volume2 size={14} aria-hidden="true" />
            <span>Required Sound</span>
          </label>
          <select
            id="fit-sound-level"
            className="fit-checker-select"
            value={params.soundLevel}
            onChange={(e) =>
              onChange({ ...params, soundLevel: e.target.value as EventParameters['soundLevel'] })
            }
            aria-label="Required sound level"
          >
            <option value="low">Low (Acoustic / Quiet spoken)</option>
            <option value="moderate">Moderate (Standard PA / Discussion)</option>
            <option value="amplified">Amplified (Music / Loud sound)</option>
          </select>
        </div>
      </div>
    </section>
  );
};
