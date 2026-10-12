import { describe, it, expect } from 'vitest';
import {
  csvEscape,
  generateBookingsCSV,
  generateBookingsReportSummary,
} from '../utils/exportUtils';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { BookingRequest } from '../types';

describe('Export and Summary Reports Feature', () => {
  const testRequests: BookingRequest[] = [
    {
      id: 'req-test-1',
      venueId: 'venue-oakridge-auditorium',
      organizerName: 'Civic Youth Orchestra',
      contactEmail: 'youth@example.org',
      eventName: 'Spring Concert Rehearsal',
      eventType: 'rehearsal',
      date: '2026-10-18',
      startTime: '18:00',
      endTime: '21:00', // 3 hours
      attendance: 85,
      soundLevel: 'amplified',
      status: 'Approved',
      staffNote: 'Keycard ready with guard.',
      createdAt: '2026-10-10T14:20:00Z',
    },
    {
      id: 'req-test-2',
      venueId: 'venue-westside-gym',
      organizerName: 'Westside Basketball',
      contactEmail: 'coach@example.org',
      eventName: 'Basketball Tournament',
      eventType: 'sports',
      date: '2026-10-24',
      startTime: '09:00',
      endTime: '12:00', // 3 hours
      attendance: 50,
      soundLevel: 'moderate',
      status: 'Pending',
      createdAt: '2026-10-11T09:15:00Z',
      seriesId: 'series-test-101',
      occurrenceIndex: 1,
      totalOccurrences: 4,
    },
  ];

  describe('csvEscape', () => {
    it('wraps fields with commas or quotes in quotes and doubles inner quotes', () => {
      expect(csvEscape('Simple')).toBe('"Simple"');
      expect(csvEscape('Hello, World')).toBe('"Hello, World"');
      expect(csvEscape('Quote "Test"')).toBe('"Quote ""Test"""');
      expect(csvEscape(undefined)).toBe('""');
      expect(csvEscape(42)).toBe('"42"');
    });
  });

  describe('generateBookingsCSV', () => {
    it('generates CSV with correct headers and rows', () => {
      const csv = generateBookingsCSV(testRequests, SAMPLE_VENUES);
      const lines = csv.split('\r\n');

      expect(lines[0]).toContain('Request ID');
      expect(lines[0]).toContain('Event Title');
      expect(lines[0]).toContain('Facility');
      expect(lines[0]).toContain('Recurring Series');

      // Row 1
      expect(lines[1]).toContain('"req-test-1"');
      expect(lines[1]).toContain('"Spring Concert Rehearsal"');
      expect(lines[1]).toContain('"Approved"');
      expect(lines[1]).toContain('"Single Event"');

      // Row 2
      expect(lines[2]).toContain('"req-test-2"');
      expect(lines[2]).toContain('"Basketball Tournament"');
      expect(lines[2]).toContain('"Pending"');
      expect(lines[2]).toContain('"Occurrence 1 of 4"');
    });
  });

  describe('generateBookingsReportSummary', () => {
    it('computes accurate executive metrics and venue usage', () => {
      const summary = generateBookingsReportSummary(testRequests, SAMPLE_VENUES);

      expect(summary.totalRequests).toBe(2);
      expect(summary.approvedCount).toBe(1);
      expect(summary.pendingCount).toBe(1);
      expect(summary.totalApprovedHours).toBe(3);
      expect(summary.totalApprovedAttendance).toBe(85);

      // Oakridge hourly price is 75, 3 hours approved = 225
      const oakridge = summary.venueSummaries.find(
        (v) => v.venueId === 'venue-oakridge-auditorium'
      );
      expect(oakridge).toBeDefined();
      expect(oakridge?.approvedBookings).toBe(1);
      expect(oakridge?.estimatedRevenue).toBe(225);
    });
  });
});
