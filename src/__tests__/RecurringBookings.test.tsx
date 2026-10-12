import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  generateRecurringDates,
  checkRecurringSeriesAvailability,
} from '../utils/recurringUtils';
import { BookingRequestModal } from '../components/BookingRequestModal';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { BookingRequest, EventParameters } from '../types';

describe('Recurring Bookings & Batch Conflict Checking', () => {
  const venue = SAMPLE_VENUES[0]; // Oakridge Community High School Auditorium

  const defaultParams: EventParameters = {
    eventType: 'workshop',
    date: '2026-10-24',
    startTime: '10:00',
    endTime: '12:00',
    attendance: 40,
    soundLevel: 'moderate',
  };

  describe('recurringUtils', () => {
    it('generates correct weekly dates sequence across month boundary', () => {
      const dates = generateRecurringDates('2026-10-24', 'weekly', 4);
      expect(dates).toEqual([
        '2026-10-24',
        '2026-10-31',
        '2026-11-07',
        '2026-11-14',
      ]);
    });

    it('generates correct bi-weekly dates sequence', () => {
      const dates = generateRecurringDates('2026-10-24', 'biweekly', 3);
      expect(dates).toEqual([
        '2026-10-24',
        '2026-11-07',
        '2026-11-21',
      ]);
    });

    it('flags dates with approved overlaps in batch conflict check', () => {
      const existing: BookingRequest[] = [
        {
          id: 'req-approved-nov07',
          venueId: venue.id,
          organizerName: 'Drama Club',
          contactEmail: 'drama@example.org',
          eventName: 'Autumn Drama Rehearsal',
          eventType: 'rehearsal',
          date: '2026-11-07',
          startTime: '10:30',
          endTime: '12:30',
          attendance: 30,
          soundLevel: 'moderate',
          status: 'Approved',
          createdAt: '2026-10-10T08:00:00Z',
        },
      ];

      const dates = ['2026-10-24', '2026-10-31', '2026-11-07', '2026-11-14'];
      const result = checkRecurringSeriesAvailability(
        venue.id,
        dates,
        '10:00',
        '12:00',
        existing
      );

      expect(result.totalCount).toBe(4);
      expect(result.availableCount).toBe(3);
      expect(result.conflictCount).toBe(1);
      expect(result.hasConflicts).toBe(true);
      expect(result.occurrences[2].hasConflict).toBe(true);
      expect(result.occurrences[2].conflictingBooking?.eventName).toBe('Autumn Drama Rehearsal');
    });
  });

  describe('BookingRequestModal with Recurring Series', () => {
    it('toggles recurring booking options and submits a series batch', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(
        <BookingRequestModal
          venue={venue}
          eventParams={defaultParams}
          existingRequests={[]}
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/event title/i), 'Community Art Series');
      await user.type(screen.getByLabelText(/organizer \/ group name/i), 'Metro Arts Club');
      await user.type(screen.getByLabelText(/contact email address/i), 'arts@metro.example.org');

      // Check recurring toggle
      const recurringCheckbox = screen.getByLabelText(/repeat as a recurring booking series/i);
      await user.click(recurringCheckbox);

      // Verify recurring settings appeared
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/series availability breakdown/i)).toBeInTheDocument();

      // Submit recurring series
      const submitBtn = screen.getByRole('button', { name: /submit series/i });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalled();
      const submittedArg = handleSubmit.mock.calls[0][0];
      expect(Array.isArray(submittedArg)).toBe(true);
      expect(submittedArg).toHaveLength(4);
      expect(submittedArg[0].seriesId).toBeDefined();
      expect(submittedArg[0].totalOccurrences).toBe(4);
      expect(submittedArg[0].occurrenceIndex).toBe(1);

      // Confirmation screen displays series info
      expect(screen.getByRole('heading', { name: /recurring series successfully submitted/i })).toBeInTheDocument();
    });

    it('blocks recurring submission when any occurrence has an approved conflict', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      const existingWithConflict: BookingRequest[] = [
        {
          id: 'req-appr-conflict',
          venueId: venue.id,
          organizerName: 'Existing Group',
          contactEmail: 'group@example.org',
          eventName: 'Civic Choir Show',
          eventType: 'performance',
          date: '2026-10-31', // 2nd occurrence in 4-week series
          startTime: '09:00',
          endTime: '13:00',
          attendance: 60,
          soundLevel: 'moderate',
          status: 'Approved',
          createdAt: '2026-10-09T10:00:00Z',
        },
      ];

      render(
        <BookingRequestModal
          venue={venue}
          eventParams={defaultParams}
          existingRequests={existingWithConflict}
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/event title/i), 'Community Art Series');
      await user.type(screen.getByLabelText(/organizer \/ group name/i), 'Metro Arts Club');
      await user.type(screen.getByLabelText(/contact email address/i), 'arts@metro.example.org');

      // Check recurring toggle
      const recurringCheckbox = screen.getByLabelText(/repeat as a recurring booking series/i);
      await user.click(recurringCheckbox);

      // Conflict warning banner is visible
      expect(screen.getByText(/one or more dates in this series overlap/i)).toBeInTheDocument();

      // Submit button is disabled
      const submitBtn = screen.getByRole('button', { name: /submit series/i });
      expect(submitBtn).toBeDisabled();
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });
});
