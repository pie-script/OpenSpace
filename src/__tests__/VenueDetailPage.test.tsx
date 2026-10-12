import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueDetailPage } from '../pages/VenueDetailPage';
import { SAMPLE_VENUES } from '../data/sampleVenues';

describe('VenueDetailPage', () => {
  const sampleVenue = SAMPLE_VENUES[0]; // Oakridge Community High School Auditorium

  it('renders venue details with name, institution, capacity, address, and pricing', () => {
    const handleBack = vi.fn();
    const handleRole = vi.fn();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={handleBack}
        onRoleChange={handleRole}
      />
    );

    expect(screen.getByRole('heading', { name: sampleVenue.name })).toBeInTheDocument();
    expect(screen.getAllByText(sampleVenue.institutionName)[0]).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`\\$${sampleVenue.hourlyPrice}`))[0]).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${sampleVenue.capacity} attendees`))[0]).toBeInTheDocument();
  });

  it('displays the facilities specific to the venue', () => {
    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
      />
    );

    sampleVenue.facilities.forEach((fac) => {
      expect(screen.getByText(fac)).toBeInTheDocument();
    });
  });

  it('displays the specific rules configured for the venue', () => {
    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
      />
    );

    // Permitted sound level
    expect(screen.getAllByText(sampleVenue.rules.maxSoundLevel)[0]).toBeInTheDocument();

    // Permitted event types
    sampleVenue.rules.allowedEventTypes.forEach((eventType) => {
      expect(screen.getByText(eventType)).toBeInTheDocument();
    });

    // Campus notes
    expect(screen.getByText(new RegExp(sampleVenue.rules.notes!))).toBeInTheDocument();
  });

  it('calls onBack when clicking the back button', async () => {
    const handleBack = vi.fn();
    const handleRole = vi.fn();
    const user = userEvent.setup();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={handleBack}
        onRoleChange={handleRole}
      />
    );

    const backBtn = screen.getByRole('button', { name: /back to venue directory/i });
    await user.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('opens request modal when clicking Request to Book Space button', async () => {
    const user = userEvent.setup();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
      />
    );

    const requestBtn = screen.getByRole('button', { name: /request to book this venue/i });
    await user.click(requestBtn);

    expect(
      screen.getByRole('heading', { name: new RegExp(`Booking Request for ${sampleVenue.name}`, 'i') })
    ).toBeInTheDocument();
    expect(screen.getByText(/Phase Roadmap Preview:/i)).toBeInTheDocument();
  });

  it('displays error state when venue is undefined (venue not found)', () => {
    const handleBack = vi.fn();

    render(
      <VenueDetailPage
        venue={undefined}
        currentRole="organizer"
        onBack={handleBack}
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /venue not found/i })).toBeInTheDocument();
    expect(
      screen.getByText(/the educational space you requested could not be located/i)
    ).toBeInTheDocument();
  });
});
