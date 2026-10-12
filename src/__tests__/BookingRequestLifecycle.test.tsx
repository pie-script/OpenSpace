import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueDetailPage } from '../pages/VenueDetailPage';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { EventParameters, BookingRequest } from '../types';

describe('Booking Request Submission & Lifecycle Flow', () => {
  const sampleVenue = SAMPLE_VENUES[0]; // Oakridge Community High School Auditorium

  const fittingParams: EventParameters = {
    eventType: 'rehearsal',
    date: '2026-10-23', // Friday
    startTime: '18:30',
    endTime: '21:00',
    attendance: 80,
    soundLevel: 'moderate',
  };

  it('opens booking request modal when clicking Request to Book Space for a fitting venue', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
        eventParams={fittingParams}
        onEventParamsChange={vi.fn()}
        existingRequests={[]}
        onRequestSubmit={handleSubmit}
      />
    );

    const bookBtn = screen.getByRole('button', { name: /request to book this venue/i });
    expect(bookBtn).toHaveTextContent(/request to book space/i);
    await user.click(bookBtn);

    // Modal dialog is open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', {
        name: new RegExp(`request booking: ${sampleVenue.name}`, 'i'),
      })
    ).toBeInTheDocument();
    expect(within(dialog).getByText('2026-10-23')).toBeInTheDocument();
    expect(within(dialog).getByText(/18:30–21:00/)).toBeInTheDocument();
  });

  it('validates required fields and submits a live pending booking request', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
        eventParams={fittingParams}
        onEventParamsChange={vi.fn()}
        existingRequests={[]}
        onRequestSubmit={handleSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /request to book this venue/i }));

    // Try submitting empty
    const submitBtn = screen.getByRole('button', { name: /submit booking request/i });
    await user.click(submitBtn);

    // Shows validation error
    expect(screen.getByText(/please provide a name for your event/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Fill fields
    const eventNameInput = screen.getByLabelText(/event title/i);
    await user.type(eventNameInput, 'High School Alumni String Quartet');

    const organizerNameInput = screen.getByLabelText(/organizer \/ group name/i);
    await user.type(organizerNameInput, 'Oakridge Strings Society');

    const emailInput = screen.getByLabelText(/contact email address/i);
    await user.type(emailInput, 'strings@example.org');

    await user.click(submitBtn);

    // Successfully submitted
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedData: BookingRequest = handleSubmit.mock.calls[0][0];

    expect(submittedData.eventName).toBe('High School Alumni String Quartet');
    expect(submittedData.organizerName).toBe('Oakridge Strings Society');
    expect(submittedData.contactEmail).toBe('strings@example.org');
    expect(submittedData.venueId).toBe(sampleVenue.id);
    expect(submittedData.status).toBe('Pending');
    expect(submittedData.date).toBe('2026-10-23');
    expect(submittedData.startTime).toBe('18:30');
    expect(submittedData.endTime).toBe('21:00');

    // Displays success confirmation card with reference ID
    expect(screen.getByText(/request successfully submitted!/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(submittedData.id))).toBeInTheDocument();
  });

  it('detects schedule conflicts with approved bookings and disables submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    // Existing approved booking at the exact same venue and overlapping slot
    const existingApproved: BookingRequest = {
      id: 'existing-appr-123',
      venueId: sampleVenue.id,
      organizerName: 'Civic Symphony',
      contactEmail: 'symphony@example.org',
      eventName: 'Grand Symphony Rehearsal',
      eventType: 'rehearsal',
      date: '2026-10-23',
      startTime: '18:00',
      endTime: '21:30',
      attendance: 200,
      soundLevel: 'amplified',
      status: 'Approved',
      createdAt: '2026-10-01',
    };

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
        eventParams={fittingParams}
        onEventParamsChange={vi.fn()}
        existingRequests={[existingApproved]}
        onRequestSubmit={handleSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /request to book this venue/i }));

    // Modal opens with conflict banner
    expect(screen.getByText(/schedule conflict detected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/already approved for "grand symphony rehearsal"/i)
    ).toBeInTheDocument();

    // Submit button is disabled
    const submitBtn = screen.getByRole('button', { name: /submit booking request/i });
    expect(submitBtn).toBeDisabled();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
