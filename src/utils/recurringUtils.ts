import type { BookingRequest } from '../types';
import { checkExistingApprovedBooking } from './conflictDetection';

/**
 * Generates a series of subsequent dates based on a starting date and interval
 */
export function generateRecurringDates(
  startDateStr: string,
  frequency: 'weekly' | 'biweekly',
  count: number
): string[] {
  if (!startDateStr || count <= 1) {
    return [startDateStr];
  }

  const [year, month, day] = startDateStr.split('-').map(Number);
  const stepDays = frequency === 'biweekly' ? 14 : 7;
  const dates: string[] = [];

  for (let i = 0; i < count; i++) {
    const current = new Date(year, month - 1, day + i * stepDays);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
  }

  return dates;
}

/**
 * Formats YYYY-MM-DD into human readable date with day of week (e.g. "Sat, Oct 24, 2026")
 */
export function formatOccurrenceDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface RecurringDateCheck {
  date: string;
  formattedDate: string;
  occurrenceNumber: number;
  hasConflict: boolean;
  conflictingBooking?: BookingRequest;
}

export interface RecurringSeriesCheckResult {
  occurrences: RecurringDateCheck[];
  totalCount: number;
  availableCount: number;
  conflictCount: number;
  hasConflicts: boolean;
}

/**
 * Evaluates schedule availability across every occurrence in a proposed recurring series
 */
export function checkRecurringSeriesAvailability(
  venueId: string,
  dates: string[],
  startTime: string,
  endTime: string,
  allRequests: BookingRequest[]
): RecurringSeriesCheckResult {
  const occurrences: RecurringDateCheck[] = dates.map((date, index) => {
    const conflictingBooking = checkExistingApprovedBooking(
      venueId,
      date,
      startTime,
      endTime,
      allRequests
    );

    return {
      date,
      formattedDate: formatOccurrenceDate(date),
      occurrenceNumber: index + 1,
      hasConflict: Boolean(conflictingBooking),
      conflictingBooking,
    };
  });

  const conflictCount = occurrences.filter((o) => o.hasConflict).length;
  const availableCount = occurrences.length - conflictCount;

  return {
    occurrences,
    totalCount: occurrences.length,
    availableCount,
    conflictCount,
    hasConflicts: conflictCount > 0,
  };
}
