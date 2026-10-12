import type { BookingRequest } from '../types';
import { timeToMinutes } from './checkVenueFit';

export interface CalendarDay {
  date: Date;
  isoDate: string; // YYYY-MM-DD
  dayName: string; // e.g., 'Mon'
  dayNumber: number; // e.g., 19
  isToday: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface CalendarEventBlock {
  request: BookingRequest;
  topPercent: number;
  heightPercent: number;
  durationMinutes: number;
}

/**
 * Returns the 7 days of the week containing the given date, starting from Monday.
 */
export function getWeekDays(referenceDate: Date): CalendarDay[] {
  const current = new Date(referenceDate);
  // Get day of week: Sunday = 0, Monday = 1, ..., Saturday = 6
  const currentDay = current.getDay();
  // Calculate distance back to Monday (if Sunday (0), distance is 6 days back)
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayIso = new Date().toISOString().split('T')[0];

  const days: CalendarDay[] = [];
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);

    const year = dayDate.getFullYear();
    const month = String(dayDate.getMonth() + 1).padStart(2, '0');
    const day = String(dayDate.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    days.push({
      date: dayDate,
      isoDate,
      dayName: DAY_NAMES[i],
      dayNumber: dayDate.getDate(),
      isToday: isoDate === todayIso,
      dayOfWeek: dayDate.getDay(),
    });
  }

  return days;
}

/**
 * Calculates top offset and height percentages within a day's time grid.
 * Standard after-hours display range: 08:00 to 22:00 (14 hours = 840 minutes).
 */
export function calculateTimelinePosition(
  startTime: string,
  endTime: string,
  rangeStartHour = 8,
  rangeEndHour = 22
): { topPercent: number; heightPercent: number; durationMinutes: number } {
  const rangeStartMinutes = rangeStartHour * 60;
  const rangeEndMinutes = rangeEndHour * 60;
  const totalRangeMinutes = rangeEndMinutes - rangeStartMinutes;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const clampedStart = Math.max(rangeStartMinutes, Math.min(rangeEndMinutes, startMinutes));
  const clampedEnd = Math.max(clampedStart, Math.min(rangeEndMinutes, endMinutes));

  const durationMinutes = Math.max(15, clampedEnd - clampedStart);

  const topPercent = ((clampedStart - rangeStartMinutes) / totalRangeMinutes) * 100;
  const heightPercent = Math.max(4, (durationMinutes / totalRangeMinutes) * 100);

  return {
    topPercent,
    heightPercent,
    durationMinutes,
  };
}

/**
 * Formats a Date to a human readable label, e.g. "October 18 – 24, 2026"
 */
export function formatWeekRangeLabel(weekDays: CalendarDay[]): string {
  if (weekDays.length === 0) return '';
  const first = weekDays[0].date;
  const last = weekDays[6].date;

  const firstMonth = first.toLocaleString('default', { month: 'short' });
  const lastMonth = last.toLocaleString('default', { month: 'short' });
  const firstYear = first.getFullYear();
  const lastYear = last.getFullYear();

  if (firstMonth === lastMonth && firstYear === lastYear) {
    return `${firstMonth} ${first.getDate()} – ${last.getDate()}, ${firstYear}`;
  }
  if (firstYear === lastYear) {
    return `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()}, ${firstYear}`;
  }
  return `${firstMonth} ${first.getDate()}, ${firstYear} – ${lastMonth} ${last.getDate()}, ${lastYear}`;
}
