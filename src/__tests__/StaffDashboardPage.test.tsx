import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffDashboardPage } from '../pages/StaffDashboardPage';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { BookingRequest } from '../types';

describe('StaffDashboardPage & Request Lifecycle', () => {
  const mockRequests: BookingRequest[] = [
    {
      id: 'req-appr-1',
      venueId: 'venue-oakridge-auditorium',
      organizerName: 'Civic Youth Philharmonic',
      contactEmail: 'youth@example.org',
      eventName: 'Spring Concert Rehearsal',
      eventType: 'rehearsal',
      date: '2026-10-18',
      startTime: '18:30',
      endTime: '21:00',
      attendance: 85,
      soundLevel: 'amplified',
      status: 'Approved',
      staffNote: 'Keycard ready at front desk.',
      createdAt: '2026-10-10T14:20:00Z',
    },
    {
      id: 'req-pend-clean',
      venueId: 'venue-westside-gym',
      organizerName: 'Westside Basketball',
      contactEmail: 'coach@example.org',
      eventName: 'Youth Basketball Camp',
      eventType: 'sports',
      date: '2026-10-24',
      startTime: '09:00',
      endTime: '12:00',
      attendance: 40,
      soundLevel: 'moderate',
      status: 'Pending',
      createdAt: '2026-10-11T09:15:00Z',
    },
    {
      id: 'req-pend-conflict',
      venueId: 'venue-oakridge-auditorium', // Overlaps req-appr-1 on same date and time
      organizerName: 'Oakridge Jazz Society',
      contactEmail: 'jazz@example.org',
      eventName: 'Jazz Jam & Workshop',
      eventType: 'workshop',
      date: '2026-10-18',
      startTime: '19:00',
      endTime: '21:30',
      attendance: 60,
      soundLevel: 'amplified',
      status: 'Pending',
      createdAt: '2026-10-12T11:00:00Z',
    },
    {
      id: 'req-dec-1',
      venueId: 'venue-lincoln-media-lab',
      organizerName: 'LAN Party Club',
      contactEmail: 'lan@example.org',
      eventName: 'Overnight Gaming Session',
      eventType: 'community',
      date: '2026-10-19',
      startTime: '18:00',
      endTime: '21:00',
      attendance: 35,
      soundLevel: 'moderate',
      status: 'Declined',
      staffNote: 'Denied: Exceeds lab guidelines.',
      createdAt: '2026-10-09T18:00:00Z',
    },
    {
      id: 'req-canc-1',
      venueId: 'venue-greenfield-commons',
      organizerName: 'Community Gardeners',
      contactEmail: 'garden@example.org',
      eventName: 'Seed Exchange',
      eventType: 'community',
      date: '2026-10-25',
      startTime: '10:00',
      endTime: '13:00',
      attendance: 45,
      soundLevel: 'low',
      status: 'Cancelled',
      staffNote: 'Cancelled due to rain forecast.',
      createdAt: '2026-10-08T10:00:00Z',
    },
  ];

  it('renders dashboard with summary statistics and request table', () => {
    render(
      <StaffDashboardPage
        venues={SAMPLE_VENUES}
        requests={mockRequests}
        currentRole="staff"
        onRoleChange={vi.fn()}
        onUpdateRequestStatus={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /institution staff dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();
    expect(screen.getByText('Approved Bookings')).toBeInTheDocument();
    expect(screen.getByText('Schedule Conflicts')).toBeInTheDocument();

    // Check request rows
    expect(screen.getByText('Spring Concert Rehearsal')).toBeInTheDocument();
    expect(screen.getByText('Youth Basketball Camp')).toBeInTheDocument();
    expect(screen.getByText('Jazz Jam & Workshop')).toBeInTheDocument();
    expect(screen.getByText('Overnight Gaming Session')).toBeInTheDocument();
    expect(screen.getByText('Seed Exchange')).toBeInTheDocument();
  });

  it('identifies schedule conflicts and flags overlapping bookings with warning badges', () => {
    render(
      <StaffDashboardPage
        venues={SAMPLE_VENUES}
        requests={mockRequests}
        currentRole="staff"
        onRoleChange={vi.fn()}
        onUpdateRequestStatus={vi.fn()}
      />
    );

    // Check conflict badge on the jazz jam request row
    expect(screen.getByText(/conflict: overlaps approved/i)).toBeInTheDocument();
    expect(screen.getAllByText(/spring concert rehearsal/i).length).toBeGreaterThanOrEqual(2);

    // Clean request has no conflict
    expect(screen.getByText('No Conflict')).toBeInTheDocument();
  });

  it('filters requests when clicking status tabs', async () => {
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

    // Click Pending tab
    const pendingTab = screen.getByRole('tab', { name: /pending/i });
    await user.click(pendingTab);

    // Only pending requests should appear
    expect(screen.getByText('Youth Basketball Camp')).toBeInTheDocument();
    expect(screen.getByText('Jazz Jam & Workshop')).toBeInTheDocument();
    expect(screen.queryByText('Overnight Gaming Session')).not.toBeInTheDocument();
    expect(screen.queryByText('Seed Exchange')).not.toBeInTheDocument();

    // Click Conflicts tab
    const conflictsTab = screen.getByRole('tab', { name: /conflicts/i });
    await user.click(conflictsTab);

    expect(screen.getByText('Jazz Jam & Workshop')).toBeInTheDocument();
    expect(screen.queryByText('Youth Basketball Camp')).not.toBeInTheDocument();
  });

  it(
    'approves a clean pending booking and triggers onUpdateRequestStatus',
    async () => {
      const handleUpdate = vi.fn();
      const user = userEvent.setup();

      render(
        <StaffDashboardPage
          venues={SAMPLE_VENUES}
          requests={mockRequests}
          currentRole="staff"
          onRoleChange={vi.fn()}
          onUpdateRequestStatus={handleUpdate}
        />
      );

      // Find and click approve on the clean pending basketball request
      const approveBtn = screen.getByRole('button', {
        name: /approve request for youth basketball camp/i,
      });
      await user.click(approveBtn);

      // Approve modal opens
      expect(screen.getByRole('heading', { name: /approve community booking/i })).toBeInTheDocument();

      // Add optional note and confirm
      const noteInput = screen.getByLabelText(/staff instructions/i);
      await user.type(noteInput, 'Keycard prepared.');

      const confirmBtn = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmBtn);

      expect(handleUpdate).toHaveBeenCalledTimes(1);
      expect(handleUpdate).toHaveBeenCalledWith(
        'req-pend-clean',
        'Approved',
        'Keycard prepared.'
      );
    },
    15000
  );

  it('strictly blocks approval when a request has a hard conflict with an approved booking', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <StaffDashboardPage
        venues={SAMPLE_VENUES}
        requests={mockRequests}
        currentRole="staff"
        onRoleChange={vi.fn()}
        onUpdateRequestStatus={handleUpdate}
      />
    );

    // Attempt to approve the conflicting jazz jam request
    const approveBtn = screen.getByRole('button', {
      name: /approve request for jazz jam & workshop/i,
    });
    await user.click(approveBtn);

    // Modal opens with blocked conflict warning
    expect(
      screen.getByRole('heading', { name: /approval blocked: schedule conflict/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/cannot approve: overlapping booking conflict/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/already approved booking:/i)).toBeInTheDocument();

    // Confirm button should not be present; only 'Understood'
    expect(screen.queryByRole('button', { name: /confirm approval/i })).not.toBeInTheDocument();

    const understoodBtn = screen.getByRole('button', { name: /understood/i });
    await user.click(understoodBtn);

    // Callback must NOT have been called
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('declines a pending booking with staff reason', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <StaffDashboardPage
        venues={SAMPLE_VENUES}
        requests={mockRequests}
        currentRole="staff"
        onRoleChange={vi.fn()}
        onUpdateRequestStatus={handleUpdate}
      />
    );

    const declineBtn = screen.getByRole('button', {
      name: /decline request for youth basketball camp/i,
    });
    await user.click(declineBtn);

    expect(screen.getByRole('heading', { name: /decline booking request/i })).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/reason for declining/i);
    await user.type(reasonInput, 'Maintenance scheduled on main bleachers.');

    const confirmDeclineBtn = screen.getByRole('button', { name: /confirm decline/i });
    await user.click(confirmDeclineBtn);

    expect(handleUpdate).toHaveBeenCalledWith(
      'req-pend-clean',
      'Declined',
      'Maintenance scheduled on main bleachers.'
    );
  });

  it('cancels an approved booking and releases slot', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <StaffDashboardPage
        venues={SAMPLE_VENUES}
        requests={mockRequests}
        currentRole="staff"
        onRoleChange={vi.fn()}
        onUpdateRequestStatus={handleUpdate}
      />
    );

    const cancelBtn = screen.getByRole('button', {
      name: /cancel approved booking for spring concert rehearsal/i,
    });
    await user.click(cancelBtn);

    expect(screen.getByRole('heading', { name: /cancel booking/i })).toBeInTheDocument();

    const confirmCancelBtn = screen.getByRole('button', { name: /confirm cancellation/i });
    await user.click(confirmCancelBtn);

    expect(handleUpdate).toHaveBeenCalledWith(
      'req-appr-1',
      'Cancelled',
      'Cancelled.'
    );
  });

  it('reopens a declined or cancelled booking as pending', async () => {
    const handleUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <StaffDashboardPage
        venues={SAMPLE_VENUES}
        requests={mockRequests}
        currentRole="staff"
        onRoleChange={vi.fn()}
        onUpdateRequestStatus={handleUpdate}
      />
    );

    const reopenBtn = screen.getByRole('button', {
      name: /reopen request for seed exchange as pending/i,
    });
    await user.click(reopenBtn);

    expect(handleUpdate).toHaveBeenCalledWith(
      'req-canc-1',
      'Pending',
      'Cancelled due to rain forecast.'
    );
  });
});
