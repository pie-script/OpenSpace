import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueDetailPage } from '../pages/VenueDetailPage';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import { INITIAL_EVENT_PARAMS } from '../utils/checkVenueFit';
import type { EventParameters } from '../types';

describe('VenueDetailPage', () => {
  const sampleVenue = SAMPLE_VENUES[0]; // Oakridge Community High School Auditorium

  it('renders venue details with name, institution, capacity, address, and pricing', () => {
    const handleBack = vi.fn();
    const handleRole = vi.fn();
    const handleParams = vi.fn();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={handleBack}
        onRoleChange={handleRole}
        eventParams={INITIAL_EVENT_PARAMS}
        onEventParamsChange={handleParams}
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
        eventParams={INITIAL_EVENT_PARAMS}
        onEventParamsChange={vi.fn()}
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
        eventParams={INITIAL_EVENT_PARAMS}
        onEventParamsChange={vi.fn()}
      />
    );

    // Permitted sound level
    expect(screen.getAllByText(sampleVenue.rules.maxSoundLevel)[0]).toBeInTheDocument();

    // Permitted event types
    sampleVenue.rules.allowedEventTypes.forEach((eventType) => {
      expect(screen.getAllByText(eventType)[0]).toBeInTheDocument();
    });

    // Campus notes
    expect(screen.getByText(new RegExp(sampleVenue.rules.notes!))).toBeInTheDocument();
  });

  it('evaluates and displays when event parameters fit the venue rules', () => {
    // Fits Oakridge: rehearsal, Fri 18:30-21:00, 100 people, moderate sound
    const fittingParams: EventParameters = {
      eventType: 'rehearsal',
      date: '2026-10-23', // Friday
      startTime: '18:30',
      endTime: '21:00',
      attendance: 100,
      soundLevel: 'moderate',
    };

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
        eventParams={fittingParams}
        onEventParamsChange={vi.fn()}
      />
    );

    expect(screen.getByText(/fits this space/i)).toBeInTheDocument();
    expect(screen.getByText(/your event meets all rules for this venue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request to book this venue/i })).toHaveTextContent(
      /request to book space/i
    );
  });

  it('evaluates and displays policy violations when event parameters exceed venue rules', () => {
    // Violates Oakridge: attendance 500 (capacity 350)
    const violatingParams: EventParameters = {
      eventType: 'rehearsal',
      date: '2026-10-23',
      startTime: '18:30',
      endTime: '21:00',
      attendance: 500, // 500 > 350
      soundLevel: 'moderate',
    };

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={vi.fn()}
        onRoleChange={vi.fn()}
        eventParams={violatingParams}
        onEventParamsChange={vi.fn()}
      />
    );

    expect(screen.getByText(/not a fit/i)).toBeInTheDocument();
    expect(screen.getByText(/attendance capacity exceeded/i)).toBeInTheDocument();
    expect(screen.getByText(/exceeds the maximum room capacity of 350/i)).toBeInTheDocument();
  });

  it('calls onBack when clicking the back button', async () => {
    const handleBack = vi.fn();
    const user = userEvent.setup();

    render(
      <VenueDetailPage
        venue={sampleVenue}
        currentRole="organizer"
        onBack={handleBack}
        onRoleChange={vi.fn()}
        eventParams={INITIAL_EVENT_PARAMS}
        onEventParamsChange={vi.fn()}
      />
    );

    const backBtn = screen.getByRole('button', { name: /back to venue directory/i });
    await user.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('displays error state when venue is undefined (venue not found)', () => {
    const handleBack = vi.fn();

    render(
      <VenueDetailPage
        venue={undefined}
        currentRole="organizer"
        onBack={handleBack}
        onRoleChange={vi.fn()}
        eventParams={INITIAL_EVENT_PARAMS}
        onEventParamsChange={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /venue not found/i })).toBeInTheDocument();
    expect(
      screen.getByText(/the educational space you requested could not be located/i)
    ).toBeInTheDocument();
  });
});
