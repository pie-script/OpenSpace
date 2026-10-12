import type {
  Venue,
  EventParameters,
  FitCheckResult,
  RuleViolation,
  SoundLevel,
} from '../types';

export const SOUND_LEVEL_SCORES: Record<SoundLevel, number> = {
  low: 1,
  moderate: 2,
  amplified: 3,
};

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const INITIAL_EVENT_PARAMS: EventParameters = {
  eventType: 'workshop',
  date: '2026-10-23', // Friday
  startTime: '19:00',
  endTime: '21:00',
  attendance: 40,
  soundLevel: 'moderate',
};

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map((val) => parseInt(val, 10) || 0);
  return hours * 60 + minutes;
}

export function checkVenueFit(venue: Venue, params: EventParameters): FitCheckResult {
  const violations: RuleViolation[] = [];
  const conditions: string[] = [];

  // 1. Operating Days check
  let dayOfWeek = -1;
  let isWeekend = false;

  if (params.date) {
    const [yearStr, monthStr, dayStr] = params.date.split('-');
    if (yearStr && monthStr && dayStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const day = parseInt(dayStr, 10);
      const dateObj = new Date(year, month, day);
      dayOfWeek = dateObj.getDay();
      isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!venue.rules.operatingDays.includes(dayOfWeek)) {
        const allowedDayNames = venue.rules.operatingDays.map((d) => DAY_NAMES[d]).join(', ');
        violations.push({
          rule: 'operatingDays',
          title: 'Closed on Selected Day',
          explanation: `This facility is closed on ${DAY_NAMES[dayOfWeek]}s. After-hours community access is only available on: ${allowedDayNames}.`,
        });
      }
    }
  }

  // 2. Operating Hours & Time Boundary check
  const permittedHours = isWeekend ? venue.rules.weekendHours : venue.rules.weekdayHours;
  const startMinutes = timeToMinutes(params.startTime);
  const endMinutes = timeToMinutes(params.endTime);
  const openMinutes = timeToMinutes(permittedHours.start);
  const closeMinutes = timeToMinutes(permittedHours.end);

  if (params.startTime && params.endTime) {
    if (endMinutes <= startMinutes) {
      violations.push({
        rule: 'operatingHours',
        title: 'Invalid Event Time Range',
        explanation: `Event end time (${params.endTime}) must be after start time (${params.startTime}).`,
      });
    } else {
      // Check if starts before opening
      if (startMinutes < openMinutes) {
        violations.push({
          rule: 'operatingHours',
          title: 'Starts Before Permitted Hours',
          explanation: `Event starts at ${params.startTime}, but outside-hours community access on ${
            isWeekend ? 'weekends' : 'weekdays'
          } begins at ${permittedHours.start}.`,
        });
      }

      // Check if ends after permitted closing time
      if (endMinutes > closeMinutes) {
        violations.push({
          rule: 'operatingHours',
          title: 'Exceeds Latest Permitted End Time',
          explanation: `Event ends at ${params.endTime}, which exceeds the facility's latest closing time of ${permittedHours.end}.`,
        });
      }

      // 3. Maximum Event Duration check
      const durationHours = (endMinutes - startMinutes) / 60;
      if (durationHours > venue.rules.maxDurationHours) {
        violations.push({
          rule: 'maxDuration',
          title: 'Exceeds Maximum Duration',
          explanation: `Requested duration of ${durationHours.toFixed(
            1
          )} hours exceeds the venue's permitted limit of ${venue.rules.maxDurationHours} hours.`,
        });
      }
    }
  }

  // 4. Allowed Event Type check
  if (params.eventType) {
    if (!venue.rules.allowedEventTypes.includes(params.eventType)) {
      const allowedList = venue.rules.allowedEventTypes.join(', ');
      violations.push({
        rule: 'eventType',
        title: 'Disallowed Event Activity',
        explanation: `${venue.name} at ${venue.institutionName} does not permit '${params.eventType}' activities. Permitted event types: ${allowedList}.`,
      });
    }
  }

  // 5. Maximum Capacity check
  const maxCapacity = venue.rules.maxAttendance || venue.capacity;
  if (params.attendance > maxCapacity) {
    violations.push({
      rule: 'maxAttendance',
      title: 'Attendance Capacity Exceeded',
      explanation: `Expected attendance of ${params.attendance} exceeds the maximum room capacity of ${maxCapacity} people.`,
    });
  }

  // 6. Sound Level check
  const reqSoundScore = SOUND_LEVEL_SCORES[params.soundLevel] || 1;
  const maxSoundScore = SOUND_LEVEL_SCORES[venue.rules.maxSoundLevel] || 3;

  if (reqSoundScore > maxSoundScore) {
    violations.push({
      rule: 'soundLevel',
      title: 'Sound Level Policy Violation',
      explanation: `Requested sound level is '${params.soundLevel}', but campus policies only permit up to '${venue.rules.maxSoundLevel}' sound here.`,
    });
  }

  // Conditions required when all rules fit
  if (venue.rules.requiresSupervision) {
    conditions.push('On-site campus facilities supervisor required during occupancy');
  }
  if (venue.rules.requiresCleanupDeposit) {
    conditions.push('Refundable campus cleanup and security deposit required');
  }

  return {
    isFit: violations.length === 0,
    violations,
    conditions,
  };
}
