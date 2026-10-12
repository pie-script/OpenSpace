import type { BookingRequest, BookingStatus } from '../types';
import { timeToMinutes } from './checkVenueFit';

export interface BookingConflict {
  conflictingRequestId: string;
  conflictingEventName: string;
  conflictingOrganizerName: string;
  conflictingStatus: BookingStatus;
  startTime: string;
  endTime: string;
  date: string;
  isHardConflict: boolean; // true if conflicting booking is 'Approved'
}

export interface ApprovalCheckResult {
  canApprove: boolean;
  reason?: string;
  conflicts: BookingConflict[];
  hardConflict?: BookingConflict;
}

/**
 * Checks whether two time intervals on the same day overlap.
 * Intervals are treated as half-open [start, end), so back-to-back bookings
 * (e.g. 17:00-19:00 and 19:00-21:00) do NOT overlap.
 */
export function doTimeIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  // Invalid or inverted times
  if (eA <= sA || eB <= sB) {
    return false;
  }

  return sA < eB && sB < eA;
}

/**
 * Finds all conflicting bookings for a given target request or proposed booking slot.
 * Ignores 'Declined' and 'Cancelled' bookings since their time slots are freed.
 */
export function findConflictsForRequest(
  target: {
    id?: string;
    venueId: string;
    date: string;
    startTime: string;
    endTime: string;
  },
  allRequests: BookingRequest[]
): BookingConflict[] {
  if (!target.venueId || !target.date || !target.startTime || !target.endTime) {
    return [];
  }

  return allRequests
    .filter((other) => {
      // Don't compare against itself
      if (target.id && other.id === target.id) {
        return false;
      }
      // Must match venue and date
      if (other.venueId !== target.venueId || other.date !== target.date) {
        return false;
      }
      // Cancelled and Declined bookings do not occupy venue time
      if (other.status === 'Cancelled' || other.status === 'Declined') {
        return false;
      }
      // Check time overlap
      return doTimeIntervalsOverlap(
        target.startTime,
        target.endTime,
        other.startTime,
        other.endTime
      );
    })
    .map((other) => ({
      conflictingRequestId: other.id,
      conflictingEventName: other.eventName,
      conflictingOrganizerName: other.organizerName,
      conflictingStatus: other.status,
      startTime: other.startTime,
      endTime: other.endTime,
      date: other.date,
      isHardConflict: other.status === 'Approved',
    }));
}

/**
 * Determines whether a booking request can be approved.
 * Approval is strictly blocked if any other booking for the same venue and time is already 'Approved'.
 */
export function checkApprovalEligibility(
  request: BookingRequest,
  allRequests: BookingRequest[]
): ApprovalCheckResult {
  const conflicts = findConflictsForRequest(request, allRequests);
  const hardConflict = conflicts.find((c) => c.isHardConflict);

  if (hardConflict) {
    return {
      canApprove: false,
      reason: `Schedule conflict: Overlaps with approved event "${hardConflict.conflictingEventName}" (${hardConflict.startTime}–${hardConflict.endTime}).`,
      conflicts,
      hardConflict,
    };
  }

  return {
    canApprove: true,
    conflicts,
  };
}

/**
 * Checks if a proposed event slot already conflicts with any 'Approved' booking.
 * Useful for organizer booking screens to alert organizers before submission.
 */
export function checkExistingApprovedBooking(
  venueId: string,
  date: string,
  startTime: string,
  endTime: string,
  allRequests: BookingRequest[]
): BookingRequest | undefined {
  return allRequests.find((r) => {
    if (r.status !== 'Approved') return false;
    if (r.venueId !== venueId || r.date !== date) return false;
    return doTimeIntervalsOverlap(startTime, endTime, r.startTime, r.endTime);
  });
}
