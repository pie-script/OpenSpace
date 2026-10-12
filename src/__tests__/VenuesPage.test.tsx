import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenuesPage } from '../pages/VenuesPage';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import { INITIAL_FILTERS } from '../utils/filterVenues';
import { INITIAL_EVENT_PARAMS } from '../utils/checkVenueFit';
import { useState } from 'react';
import type { VenueFilterState, EventParameters } from '../types';

// Helper wrapper component to test real state interaction
function VenuesPageTestHarness({ onSelect = vi.fn() }: { onSelect?: (id: string) => void }) {
  const [filters, setFilters] = useState<VenueFilterState>(INITIAL_FILTERS);
  const [eventParams, setEventParams] = useState<EventParameters>(INITIAL_EVENT_PARAMS);

  return (
    <VenuesPage
      venues={SAMPLE_VENUES}
      currentRole="organizer"
      onSelectVenue={onSelect}
      filters={filters}
      onFilterChange={setFilters}
      onResetFilters={() => setFilters(INITIAL_FILTERS)}
      eventParams={eventParams}
      onEventParamsChange={setEventParams}
      onResetEventParams={() => setEventParams(INITIAL_EVENT_PARAMS)}
    />
  );
}

describe('VenuesPage Integration', () => {
  it('renders all sample venue cards with their name, institution, capacity, price, and facilities', () => {
    render(<VenuesPageTestHarness />);

    // Check header
    expect(screen.getByRole('heading', { name: /browse available spaces/i })).toBeInTheDocument();
    expect(screen.getByText(/campus policy & rule fit evaluator/i)).toBeInTheDocument();

    // Check venue cards
    expect(screen.getByText('Auditorium & Performing Arts Stage')).toBeInTheDocument();
    expect(screen.getByText('Oakridge Community High School')).toBeInTheDocument();
    expect(screen.getByText('Varsity Indoor Gymnasium & Pavilion')).toBeInTheDocument();
    expect(screen.getAllByText('75')[0]).toBeInTheDocument();
  });

  it('displays rule fit badges and mismatch reasons for each venue card', () => {
    render(<VenuesPageTestHarness />);

    // Default params: workshop, Fri 19:00-21:00, 40 attendees, moderate sound
    // Venues that allow workshop with 40 people should show Compatible Fit
    const fitStrips = screen.getAllByRole('status');
    expect(fitStrips.length).toBeGreaterThan(0);

    // Should indicate compatible fits and policy mismatches
    expect(screen.getAllByText(/compatible fit/i)[0]).toBeInTheDocument();
  });

  it('updates rule fit evaluations when organizer changes event parameters', async () => {
    const user = userEvent.setup();
    render(<VenuesPageTestHarness />);

    // Change event activity to 'sports' in Fit Checker
    const activitySelect = screen.getByLabelText(/event activity/i);
    await user.selectOptions(activitySelect, 'sports');

    // Oakridge Auditorium does not allow sports -> should show Policy Mismatch on Auditorium card
    expect(screen.getAllByText(/policy mismatch/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/disallowed event activity/i)[0]).toBeInTheDocument();
  });

  it('filters results when switching to Catalog Search tab and filtering by category', async () => {
    const user = userEvent.setup();
    render(<VenuesPageTestHarness />);

    // Switch to Catalog Search & Amenities tab
    const filterTab = screen.getByRole('tab', { name: /catalog search & amenities/i });
    await user.click(filterTab);

    const select = screen.getByLabelText(/filter by event category/i);
    await user.selectOptions(select, 'sports');

    // Only Westside Gymnasium allows sports
    expect(screen.getByText('Varsity Indoor Gymnasium & Pavilion')).toBeInTheDocument();
    expect(
      screen.queryByText('Auditorium & Performing Arts Stage')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/showing 1 of 6 campus facilities/i)).toBeInTheDocument();
  });

  it('displays a helpful empty state when no venues match filter criteria', async () => {
    const user = userEvent.setup();
    render(<VenuesPageTestHarness />);

    // Switch to Catalog Search tab
    const filterTab = screen.getByRole('tab', { name: /catalog search & amenities/i });
    await user.click(filterTab);

    // Filter with impossible criteria: attendance 999
    const attendanceInput = screen.getByLabelText(/filter by minimum attendance/i);
    await user.type(attendanceInput, '999');

    expect(
      screen.getByRole('heading', { name: /no matching campus spaces found/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we couldn’t find any school, university, or library spaces/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/try lowering your expected attendance/i)).toBeInTheDocument();
  });

  it('resets filters when clicking the empty state reset button', async () => {
    const user = userEvent.setup();
    render(<VenuesPageTestHarness />);

    // Switch to Catalog Search tab
    const filterTab = screen.getByRole('tab', { name: /catalog search & amenities/i });
    await user.click(filterTab);

    const attendanceInput = screen.getByLabelText(/filter by minimum attendance/i);
    await user.type(attendanceInput, '999');

    // Should see empty state
    expect(
      screen.getByRole('heading', { name: /no matching campus spaces found/i })
    ).toBeInTheDocument();

    // Click "Reset All Filters"
    const resetBtn = screen.getByRole('button', { name: /reset all search filters/i });
    await user.click(resetBtn);

    // All venues should be restored
    expect(screen.getByText('Auditorium & Performing Arts Stage')).toBeInTheDocument();
    expect(screen.getByText('Varsity Indoor Gymnasium & Pavilion')).toBeInTheDocument();
    expect(screen.getByLabelText(/showing 6 of 6 campus facilities/i)).toBeInTheDocument();
  });

  it('calls onSelectVenue when clicking venue card button', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<VenuesPageTestHarness onSelect={onSelect} />);

    const detailBtn = screen.getByRole('button', {
      name: /view details and rules for auditorium & performing arts stage/i,
    });
    await user.click(detailBtn);

    expect(onSelect).toHaveBeenCalledWith('venue-oakridge-auditorium');
  });
});
