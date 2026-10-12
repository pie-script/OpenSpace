import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { resetToDemoDefaults } from '../services/storage';

describe('App Navigation and Shell Integration', () => {
  beforeEach(() => {
    window.location.hash = '';
    resetToDemoDefaults();
  });

  it('renders home page by default with hero title and sample venues', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /unlock school, university & library spaces for your community/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/oakridge performing arts auditorium/i)).toBeInTheDocument();
  });

  it('navigates to Browse Venues page from the main navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const venuesNavBtn = within(nav).getByRole('button', { name: /browse venues/i });
    await user.click(venuesNavBtn);

    expect(
      screen.getByRole('heading', { name: /browse available spaces/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/6 of 6 spaces matching/i)).toBeInTheDocument();
  });

  it('navigates to Staff Dashboard from the main navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const staffNavBtn = within(nav).getByRole('button', { name: /staff dashboard/i });
    await user.click(staffNavBtn);

    expect(
      screen.getByRole('heading', { name: /institution staff dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/managed campus facilities/i)).toBeInTheDocument();
  });

  it('navigates to Venues from the Hero CTA button', async () => {
    const user = userEvent.setup();
    render(<App />);

    const ctaBtn = screen.getByRole('button', { name: /browse available venues/i });
    await user.click(ctaBtn);

    expect(
      screen.getByRole('heading', { name: /browse available spaces/i })
    ).toBeInTheDocument();
  });

  it('toggles demo role between Organizer and Staff and displays active banner', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initial state: Organizer
    expect(
      screen.getByText(/demo mode: active as organizer/i)
    ).toBeInTheDocument();

    // Toggle via the role banner switch button
    const bannerSwitchBtn = screen.getByRole('button', {
      name: /switch demo mode to institution staff/i,
    });
    await user.click(bannerSwitchBtn);

    // Should now be Institution Staff
    expect(
      screen.getByText(/demo mode: active as institution staff/i)
    ).toBeInTheDocument();
  });

  it('navigates back to Home when clicking Home in the navbar', async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const venuesNavBtn = within(nav).getByRole('button', { name: /browse venues/i });
    await user.click(venuesNavBtn);

    expect(
      screen.getByRole('heading', { name: /browse available spaces/i })
    ).toBeInTheDocument();

    const homeNavBtn = within(nav).getByRole('button', { name: /home/i });
    await user.click(homeNavBtn);

    expect(
      screen.getByRole('heading', {
        name: /unlock school, university & library spaces for your community/i,
      })
    ).toBeInTheDocument();
  });
});
