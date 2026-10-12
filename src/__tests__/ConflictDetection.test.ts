import { describe, it, expect } from 'vitest';
import {
  doTimeIntervalsOverlap,
  findConflictsForRequest,
  checkApprovalEligibility,
  checkExistingApprovedBooking,
} from '../utils/conflictDetection';
import type { BookingRequest } from '../types';

describe('Conflict Detection Engine', () => {
  describe('doTimeIntervalsOverlap', () => {
    it('detects overlapping intervals', () => {
      expect(doTimeIntervalsOverlap('18:00', '20:00', '19:00', '21:00')).toBe(true);
      expect(doTimeIntervalsOverlap('19:00', '21:00', '18:00', '20:00')).toBe(true);
    });

    it('detects fully contained intervals', () => {
      expect(doTimeIntervalsOverlap('18:00', '22:00', '19:00', '20:00')).toBe(true);
      expect(doTimeIntervalsOverlap('19:00', '20:00', '18:00', '22:00')).toBe(true);
    });

    it('considers abutting / back-to-back intervals as non-overlapping', () => {
      // 17:00-19:00 ends right when 19:00-21:00 begins
      expect(doTimeIntervalsOverlap('17:00', '19:00', '19:00', '21:00')).toBe(false);
      expect(doTimeIntervalsOverlap('19:00', '21:00', '17:00', '19:00')).toBe(false);
    });

    it('detects completely disjoint intervals as non-overlapping', () => {
      expect(doTimeIntervalsOverlap('10:00', '12:00', '14:00', '16:00')).toBe(false);
      expect(doTimeIntervalsOverlap('14:00', '16:00', '10:00', '12:00')).toBe(false);
    });

    it('returns false for invalid inverted intervals', () => {
      expect(doTimeIntervalsOverlap('20:00', '18:00', '17:00', '21:00')).toBe(false);
    });
  });

  describe('findConflictsForRequest', () => {
    const mockRequests: BookingRequest[] = [
      {
        id: 'req-1',
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '18:00',
        endTime: '20:30',
        organizerName: 'Civic Choir',
        contactEmail: 'choir@example.org',
        eventName: 'Rehearsal',
        eventType: 'rehearsal',
        attendance: 50,
        soundLevel: 'moderate',
        status: 'Approved',
        createdAt: '2026-10-01',
      },
      {
        id: 'req-2',
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '20:00',
        endTime: '22:00',
        organizerName: 'Drama Club',
        contactEmail: 'drama@example.org',
        eventName: 'Stage Prep',
        eventType: 'workshop',
        attendance: 30,
        soundLevel: 'low',
        status: 'Pending',
        createdAt: '2026-10-02',
      },
      {
        id: 'req-3',
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '18:30',
        endTime: '21:00',
        organizerName: 'Dance Crew',
        contactEmail: 'dance@example.org',
        eventName: 'Auditions',
        eventType: 'community',
        attendance: 40,
        soundLevel: 'amplified',
        status: 'Declined', // Declined should NOT cause conflict!
        createdAt: '2026-10-03',
      },
      {
        id: 'req-4',
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '18:00',
        endTime: '20:00',
        organizerName: 'Poetry Club',
        contactEmail: 'poetry@example.org',
        eventName: 'Open Mic',
        eventType: 'community',
        attendance: 25,
        soundLevel: 'low',
        status: 'Cancelled', // Cancelled should NOT cause conflict!
        createdAt: '2026-10-04',
      },
      {
        id: 'req-5',
        venueId: 'gymnasium', // Different venue
        date: '2026-10-20',
        startTime: '18:00',
        endTime: '21:00',
        organizerName: 'Basketball Team',
        contactEmail: 'hoops@example.org',
        eventName: 'Practice',
        eventType: 'sports',
        attendance: 20,
        soundLevel: 'moderate',
        status: 'Approved',
        createdAt: '2026-10-05',
      },
      {
        id: 'req-6',
        venueId: 'auditorium',
        date: '2026-10-21', // Different date
        startTime: '18:00',
        endTime: '21:00',
        organizerName: 'Tech Meetup',
        contactEmail: 'tech@example.org',
        eventName: 'Keynote',
        eventType: 'lecture',
        attendance: 80,
        soundLevel: 'moderate',
        status: 'Approved',
        createdAt: '2026-10-06',
      },
    ];

    it('identifies hard conflicts with approved bookings at the same venue and date', () => {
      const target = {
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '19:00',
        endTime: '21:00',
      };
      const conflicts = findConflictsForRequest(target, mockRequests);

      // Should conflict with req-1 (Approved, 18:00-20:30) and req-2 (Pending, 20:00-22:00)
      // Should NOT conflict with req-3 (Declined), req-4 (Cancelled), req-5 (Different venue), req-6 (Different date)
      expect(conflicts).toHaveLength(2);

      const hardConflict = conflicts.find((c) => c.conflictingRequestId === 'req-1');
      expect(hardConflict).toBeDefined();
      expect(hardConflict?.isHardConflict).toBe(true);
      expect(hardConflict?.conflictingEventName).toBe('Rehearsal');

      const softConflict = conflicts.find((c) => c.conflictingRequestId === 'req-2');
      expect(softConflict).toBeDefined();
      expect(softConflict?.isHardConflict).toBe(false);
      expect(softConflict?.conflictingStatus).toBe('Pending');
    });

    it('excludes target booking from its own conflict list when target has an id', () => {
      const conflicts = findConflictsForRequest(mockRequests[1], mockRequests);
      // req-2 (20:00-22:00) overlaps req-1 (18:00-20:30)
      // It should NOT include itself (req-2)
      expect(conflicts.some((c) => c.conflictingRequestId === 'req-2')).toBe(false);
      expect(conflicts.some((c) => c.conflictingRequestId === 'req-1')).toBe(true);
    });

    it('returns empty array when venue is completely free', () => {
      const freeTarget = {
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '10:00',
        endTime: '12:00',
      };
      const conflicts = findConflictsForRequest(freeTarget, mockRequests);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('checkApprovalEligibility', () => {
    it('blocks approval if an overlapping approved booking already exists', () => {
      const pendingRequest: BookingRequest = {
        id: 'target-pending',
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '19:00',
        endTime: '21:00',
        organizerName: 'Jazz Club',
        contactEmail: 'jazz@example.org',
        eventName: 'Jazz Evening',
        eventType: 'performance',
        attendance: 40,
        soundLevel: 'amplified',
        status: 'Pending',
        createdAt: '2026-10-07',
      };

      const existingApproved: BookingRequest = {
        id: 'existing-approved',
        venueId: 'auditorium',
        date: '2026-10-20',
        startTime: '18:00',
        endTime: '20:00',
        organizerName: 'Civic Choir',
        contactEmail: 'choir@example.org',
        eventName: 'Rehearsal',
        eventType: 'rehearsal',
        attendance: 50,
        soundLevel: 'moderate',
        status: 'Approved',
        createdAt: '2026-10-01',
      };

      const result = checkApprovalEligibility(pendingRequest, [existingApproved]);
      expect(result.canApprove).toBe(false);
      expect(result.reason).toContain('Schedule conflict');
      expect(result.hardConflict?.conflictingEventName).toBe('Rehearsal');
    });

    it('permits approval if overlapping requests are only other Pending requests', () => {
      const reqA: BookingRequest = {
        id: 'pending-a',
        venueId: 'gymnasium',
        date: '2026-10-25',
        startTime: '18:00',
        endTime: '20:00',
        organizerName: 'Club A',
        contactEmail: 'cluba@example.org',
        eventName: 'Match A',
        eventType: 'sports',
        attendance: 20,
        soundLevel: 'low',
        status: 'Pending',
        createdAt: '2026-10-01',
      };

      const reqB: BookingRequest = {
        id: 'pending-b',
        venueId: 'gymnasium',
        date: '2026-10-25',
        startTime: '19:00',
        endTime: '21:00',
        organizerName: 'Club B',
        contactEmail: 'clubb@example.org',
        eventName: 'Match B',
        eventType: 'sports',
        attendance: 20,
        soundLevel: 'low',
        status: 'Pending',
        createdAt: '2026-10-02',
      };

      // When approving reqA, there are no hard conflicts (reqB is only pending)
      const result = checkApprovalEligibility(reqA, [reqA, reqB]);
      expect(result.canApprove).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].isHardConflict).toBe(false);
    });
  });

  describe('checkExistingApprovedBooking', () => {
    it('returns the approved booking if one overlaps proposed slot', () => {
      const approved: BookingRequest = {
        id: 'appr-1',
        venueId: 'lab-1',
        date: '2026-10-22',
        startTime: '18:00',
        endTime: '21:00',
        organizerName: 'Robotics Club',
        contactEmail: 'robotics@example.org',
        eventName: 'Build Session',
        eventType: 'workshop',
        attendance: 15,
        soundLevel: 'low',
        status: 'Approved',
        createdAt: '2026-10-01',
      };

      const found = checkExistingApprovedBooking('lab-1', '2026-10-22', '19:00', '20:00', [approved]);
      expect(found).toBeDefined();
      expect(found?.id).toBe('appr-1');

      const notFound = checkExistingApprovedBooking('lab-1', '2026-10-22', '21:00', '22:00', [approved]);
      expect(notFound).toBeUndefined();
    });
  });
});
