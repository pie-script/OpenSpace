import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VenueModal } from '../components/VenueModal';
import { StaffDashboardPage } from '../pages/StaffDashboardPage';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { Venue, BookingRequest } from '../types';

describe('Venue Listing Management (Phase 5)', () => {
  const sampleVenue = SAMPLE_VENUES[0];

  describe('VenueModal Form', () => {
    it('renders in create mode and validates required fields', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();

      render(
        <VenueModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={handleSave}
        />
      );

      expect(screen.getByRole('heading', { name: /add new campus facility/i })).toBeInTheDocument();

      // Clear the name input and submit
      const nameInput = screen.getByLabelText(/facility \/ space name/i);
      await user.clear(nameInput);

      const submitBtn = screen.getByRole('button', { name: /publish venue listing/i });
      await user.click(submitBtn);

      expect(screen.getByText(/please provide a name for the facility/i)).toBeInTheDocument();
      expect(handleSave).not.toHaveBeenCalled();
    });

    it('submits a new venue with configured rules and operating times', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();

      render(
        <VenueModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={handleSave}
        />
      );

      // Fill basic details
      await user.type(screen.getByLabelText(/facility \/ space name/i), 'Hillcrest Robotics & Makerspace');
      await user.type(screen.getByLabelText(/institution name/i), 'Hillcrest STEM Academy');
      await user.type(screen.getByLabelText(/street address/i), '88 Innovation Way');
      await user.type(screen.getByLabelText(/^city/i), 'Hillcrest');

      // Click rules tab
      const rulesTab = screen.getByRole('tab', { name: /after-hours rules/i });
      await user.click(rulesTab);

      // Submit form
      const submitBtn = screen.getByRole('button', { name: /publish venue listing/i });
      await user.click(submitBtn);

      expect(handleSave).toHaveBeenCalledTimes(1);
      const saved: Venue = handleSave.mock.calls[0][0];
      expect(saved.name).toBe('Hillcrest Robotics & Makerspace');
      expect(saved.institutionName).toBe('Hillcrest STEM Academy');
      expect(saved.address).toBe('88 Innovation Way');
      expect(saved.isAvailable).toBe(true);
      expect(saved.rules.operatingDays.length).toBeGreaterThan(0);
      expect(saved.rules.allowedEventTypes.length).toBeGreaterThan(0);
    });

    it('pre-fills existing venue data in edit mode and saves changes', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();

      render(
        <VenueModal
          venue={sampleVenue}
          isOpen={true}
          onClose={vi.fn()}
          onSave={handleSave}
        />
      );

      expect(screen.getByRole('heading', { name: new RegExp(`edit facility: ${sampleVenue.name}`, 'i') })).toBeInTheDocument();

      const priceInput = screen.getByLabelText(/hourly rental price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '125');

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveBtn);

      expect(handleSave).toHaveBeenCalledTimes(1);
      const updated: Venue = handleSave.mock.calls[0][0];
      expect(updated.id).toBe(sampleVenue.id);
      expect(updated.hourlyPrice).toBe(125);
    });
  });

  describe('Staff Dashboard Venue Management Integration', () => {
    const mockRequests: BookingRequest[] = [];

    it('opens create modal when clicking Add New Space', async () => {
      const user = userEvent.setup();
      const handleSaveVenue = vi.fn();

      render(
        <StaffDashboardPage
          venues={SAMPLE_VENUES}
          requests={mockRequests}
          currentRole="staff"
          onRoleChange={vi.fn()}
          onUpdateRequestStatus={vi.fn()}
          onSaveVenue={handleSaveVenue}
        />
      );

      const addBtn = screen.getByRole('button', { name: /add new campus facility/i });
      await user.click(addBtn);

      expect(screen.getByRole('heading', { name: /add new campus facility/i })).toBeInTheDocument();
    });

    it('toggles venue availability when clicking activate/deactivate', async () => {
      const user = userEvent.setup();
      const handleSaveVenue = vi.fn();

      render(
        <StaffDashboardPage
          venues={SAMPLE_VENUES}
          requests={mockRequests}
          currentRole="staff"
          onRoleChange={vi.fn()}
          onUpdateRequestStatus={vi.fn()}
          onSaveVenue={handleSaveVenue}
        />
      );

      // Oakridge is currently available -> click Deactivate
      const toggleBtn = screen.getByRole('button', {
        name: new RegExp(`toggle availability for ${sampleVenue.name}`, 'i'),
      });
      await user.click(toggleBtn);

      expect(handleSaveVenue).toHaveBeenCalledTimes(1);
      const updated: Venue = handleSaveVenue.mock.calls[0][0];
      expect(updated.id).toBe(sampleVenue.id);
      expect(updated.isAvailable).toBe(false);
    });

    it('deletes venue when clicking delete and confirming', async () => {
      const user = userEvent.setup();
      const handleDeleteVenue = vi.fn();

      render(
        <StaffDashboardPage
          venues={SAMPLE_VENUES}
          requests={mockRequests}
          currentRole="staff"
          onRoleChange={vi.fn()}
          onUpdateRequestStatus={vi.fn()}
          onDeleteVenue={handleDeleteVenue}
        />
      );

      const deleteBtn = screen.getByRole('button', {
        name: new RegExp(`delete ${sampleVenue.name}`, 'i'),
      });
      await user.click(deleteBtn);

      // Delete confirmation modal appears
      expect(screen.getByRole('heading', { name: /delete facility listing/i })).toBeInTheDocument();

      const confirmDeleteBtn = screen.getByRole('button', { name: /delete space/i });
      await user.click(confirmDeleteBtn);

      expect(handleDeleteVenue).toHaveBeenCalledWith(sampleVenue.id);
    });

    it('triggers demo data reset when clicking Reset Demo Data and confirming', async () => {
      const user = userEvent.setup();
      const handleResetData = vi.fn();

      render(
        <StaffDashboardPage
          venues={SAMPLE_VENUES}
          requests={mockRequests}
          currentRole="staff"
          onRoleChange={vi.fn()}
          onUpdateRequestStatus={vi.fn()}
          onResetData={handleResetData}
        />
      );

      const resetBtn = screen.getByRole('button', { name: /reset demo data/i });
      await user.click(resetBtn);

      expect(screen.getByRole('heading', { name: /reset prototype demo data/i })).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /confirm reset/i });
      await user.click(confirmBtn);

      expect(handleResetData).toHaveBeenCalledTimes(1);
    });
  });
});
