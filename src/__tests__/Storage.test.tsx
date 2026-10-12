import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredVenues,
  saveStoredVenues,
  getStoredRequests,
  getStoredRole,
  saveStoredRole,
  resetToDemoDefaults,
} from '../services/storage';

describe('Demo Data Storage Layer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads sample venues by default when empty', () => {
    const venues = getStoredVenues();
    expect(venues.length).toBe(6);
    expect(venues[0].institutionType).toBe('School');
  });

  it('persists and updates role correctly', () => {
    saveStoredRole('staff');
    expect(getStoredRole()).toBe('staff');

    saveStoredRole('organizer');
    expect(getStoredRole()).toBe('organizer');
  });

  it('persists modified venues and resets back to defaults', () => {
    const venues = getStoredVenues();
    const updated = venues.slice(0, 2);
    saveStoredVenues(updated);

    expect(getStoredVenues().length).toBe(2);

    const resetResult = resetToDemoDefaults();
    expect(resetResult.venues.length).toBe(6);
    expect(getStoredVenues().length).toBe(6);
    expect(resetResult.role).toBe('organizer');
  });

  it('provides initial realistic requests for staff demonstration', () => {
    const requests = getStoredRequests();
    expect(requests.length).toBeGreaterThanOrEqual(3);
    expect(requests.some((r) => r.status === 'Pending')).toBe(true);
    expect(requests.some((r) => r.status === 'Approved')).toBe(true);
  });
});
