import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeeklyCalendarView } from '../components/WeeklyCalendarView';
import { StaffDashboardPage } from '../pages/StaffDashboardPage';
import {
  getWeekDays,
  calculateTimelinePosition,
  formatWeekRangeLabel,
} from '../utils/calendarUtils';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { BookingRequest } from '../types';

describe('Weekly Calendar Timeline Feature', () => {
  const mockRequests: BookingRequest[] = [
    {
      id: 'req-appr-orch',
      venueId: 'venue-oakridge-auditorium',
      organizerName: 'Civic Youth Philharmonic',
      contactEmail: 'youth@example.org',
      eventName: 'Spring Concert Rehearsal',
      eventType: 'rehearsal',
      date: '2026-10-18', // Sunday
      startTime: '18:30',
      endTime: '21:00',
      attendance: 85,
      soundLevel: 'amplified',
      status: 'Approved',
      staffNote: 'Keycard ready at front desk.',
      createdAt: '2026-10-10T14:20:00Z',
    },
    {
      id: 'req-pend-jazz',
      venueId: 'venue-oakridge-auditorium',
      organizerName: 'Oakridge Jazz Society',
      contactEmail: 'jazz@example.org',
      eventName: 'Community Jazz Jam',
      eventType: 'workshop',
      date: '2026-10-18', // Sunday - Overlaps req-appr-orch
      startTime: '19:00',
      endTime: '21:30',
      attendance: 60,
      soundLevel: 'amplified',
      status: 'Pending',
      createdAt: '2026-10-12T11:00:00Z',
    },
    {
      id: 'req-pend-bb',
      venueId: 'venue-westside-gym',
      organizerName: 'Westside Basketball',
      contactEmail: 'coach@example.org',
      eventName: 'Regional Basketball Clinic',
      eventType: 'sports',
      date: '2026-10-24', // Saturday
      startTime: '09:00',
      endTime: '12:00',
      attendance: 40,
      soundLevel: 'moderate',
      status: 'Pending',
      createdAt: '2026-10-11T09:15:00Z',
    },
  ];

  describe('calendarUtils', () => {
    it('calculates 7 continuous days starting from Monday', () => {
      const refDate = new Date(2026, 9, 21); // Wednesday, Oct 21, 2026
      const week = getWeekDays(refDate);

      expect(week).toHaveLength(7);
      expect(week[0].dayName).toBe('Mon');
      expect(week[0].isoDate).toBe('2026-10-19');
      expect(week[6].dayName).toBe('Sun');
      expect(week[6].isoDate).toBe('2026-10-25');
    });

    it('calculates timeline top and height percentages correctly', () => {
      // 08:00 to 22:00 is 14 hours (840 minutes)
      // Event 08:00 to 15:00 starts at top 0%, duration 7 hrs = 50% height
      const pos1 = calculateTimelinePosition('08:00', '15:00', 8, 22);
      expect(pos1.topPercent).toBeCloseTo(0);
      expect(pos1.heightPercent).toBeCloseTo(50);

      // Event 15:00 to 22:00 starts at top 50%, duration 7 hrs = 50% height
      const pos2 = calculateTimelinePosition('15:00', '22:00', 8, 22);
      expect(pos2.topPercent).toBeCloseTo(50);
      expect(pos2.heightPercent).toBeCloseTo(50);
    });

    it('formats week range label nicely', () => {
      const week = getWeekDays(new Date(2026, 9, 21));
      const label = formatWeekRangeLabel(week);
      expect(label).toContain('Oct 19');
      expect(label).toContain('25, 2026');
    });
  });

  describe('WeeklyCalendarView Component', () => {
    it('renders weekly timeline grid with day columns and hour markers', () => {
      render(
        <WeeklyCalendarView
          requests={mockRequests}
          venues={SAMPLE_VENUES}
          currentRole="staff"
        />
      );

      // Verify time markers
      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('18:00')).toBeInTheDocument();
      expect(screen.getByText('22:00')).toBeInTheDocument();

      // Verify day headers
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    it('displays event cards on the timeline and flags conflicts', () => {
      render(
        <WeeklyCalendarView
          requests={mockRequests}
          venues={SAMPLE_VENUES}
          currentRole="staff"
        />
      );

      // Event cards on timeline for that week
      expect(screen.getByText('Regional Basketball Clinic')).toBeInTheDocument();
    });

    it('opens event popover dialog when clicking an event block', async () => {
      const user = userEvent.setup();
      const handleUpdate = vi.fn();

      render(
        <WeeklyCalendarView
          requests={mockRequests}
          venues={SAMPLE_VENUES}
          currentRole="staff"
          onUpdateRequestStatus={handleUpdate}
        />
      );

      const eventCard = screen.getByText('Regional Basketball Clinic');
      await user.click(eventCard);

      // Modal dialog opens with details
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Regional Basketball Clinic' })).toBeInTheDocument();
      expect(screen.getByText(/westside basketball/i)).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();

      // Staff quick approve action button is available
      const approveBtn = screen.getByRole('button', { name: /approve booking/i });
      await user.click(approveBtn);

      expect(handleUpdate).toHaveBeenCalledWith('req-pend-bb', 'Approved');
    });

    it('navigates weeks using next and previous buttons', async () => {
      const user = userEvent.setup();

      render(
        <WeeklyCalendarView
          requests={mockRequests}
          venues={SAMPLE_VENUES}
          currentRole="staff"
        />
      );

      const nextWeekBtn = screen.getByRole('button', { name: /next week/i });
      await user.click(nextWeekBtn);

      // Header label shifts to next week
      expect(screen.getByText(/Oct 26 – Nov 1, 2026/i)).toBeInTheDocument();

      const prevWeekBtn = screen.getByRole('button', { name: /previous week/i });
      await user.click(prevWeekBtn);

      // Back to Oct demo week
      expect(screen.getByText(/Oct 19 – 25, 2026/i)).toBeInTheDocument();
    });
  });

  describe('Staff Dashboard View Switching', () => {
    it('switches between Table View and Weekly Timeline View', async () => {
      const user = userEvent.setup();

      render(
        <StaffDashboardPage
          venues={SAMPLE_VENUES}
          requests={mockRequests}
          currentRole="staff"
          onRoleChange={vi.fn()}
          onUpdateRequestStatus={vi.fn()}
        />
      );

      // Initially in table view
      expect(screen.getByRole('button', { name: /weekly timeline view/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /all \(3\)/i })).toBeInTheDocument();

      // Switch to Weekly Timeline View
      const calendarToggle = screen.getByRole('button', { name: /weekly timeline view/i });
      await user.click(calendarToggle);

      // Now timeline view is rendered
      expect(screen.getByLabelText(/weekly booking schedule timeline/i)).toBeInTheDocument();
      expect(screen.getByText('Oct 2026 Demo Week')).toBeInTheDocument();

      // Switch back to Table View
      const tableToggle = screen.getByRole('button', { name: /table view/i });
      await user.click(tableToggle);

      expect(screen.getByRole('tab', { name: /all \(3\)/i })).toBeInTheDocument();
    });
  });
});
