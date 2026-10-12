import { describe, it, expect } from 'vitest';
import { filterVenues, INITIAL_FILTERS, matchesFacility } from '../utils/filterVenues';
import { SAMPLE_VENUES } from '../data/sampleVenues';

describe('Venue Filter Engine', () => {
  it('returns all venues when filters are in initial default state', () => {
    const results = filterVenues(SAMPLE_VENUES, INITIAL_FILTERS);
    expect(results.length).toBe(SAMPLE_VENUES.length);
  });

  it('filters venues by event type', () => {
    // 'sports' is only allowed in Westside Gymnasium
    const results = filterVenues(SAMPLE_VENUES, {
      ...INITIAL_FILTERS,
      eventType: 'sports',
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('venue-westside-gym');
  });

  it('filters venues by minimum attendance', () => {
    // Only Oakridge Auditorium has capacity >= 300 (capacity 350)
    const results = filterVenues(SAMPLE_VENUES, {
      ...INITIAL_FILTERS,
      attendance: 300,
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('venue-oakridge-auditorium');
  });

  it('filters venues by operating day of the week based on date', () => {
    // 2026-10-18 is a Sunday (day 0)
    // Oakridge Auditorium is Mon-Sat [1,2,3,4,5,6], so it should NOT be included
    // Westside Gym [1,2,3,4,5,6,0] and Central Library [2,3,4,5,6,0] ARE open on Sunday
    const results = filterVenues(SAMPLE_VENUES, {
      ...INITIAL_FILTERS,
      date: '2026-10-18',
    });

    const hasOakridge = results.some((v) => v.id === 'venue-oakridge-auditorium');
    expect(hasOakridge).toBe(false);

    const hasWestside = results.some((v) => v.id === 'venue-westside-gym');
    expect(hasWestside).toBe(true);
  });

  it('filters venues by required facility keywords', () => {
    const results = filterVenues(SAMPLE_VENUES, {
      ...INITIAL_FILTERS,
      facilities: ['Stage Lighting'],
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('venue-oakridge-auditorium');
  });

  it('correctly combines multiple filters (date + eventType + attendance)', () => {
    // Meeting + 40 people
    const results = filterVenues(SAMPLE_VENUES, {
      ...INITIAL_FILTERS,
      eventType: 'meeting',
      attendance: 40,
    });

    // Venues that allow 'meeting' and have capacity >= 40:
    // Oakridge (350), Metro Lecture Hall (180), Central Library (140), St Jude Seminar (45)
    expect(results.length).toBe(4);
    results.forEach((v) => {
      expect(v.capacity).toBeGreaterThanOrEqual(40);
      expect(v.rules.allowedEventTypes).toContain('meeting');
    });
  });

  it('returns empty array when no venues match filter combination', () => {
    // Sports event with 500 attendees (no venue has capacity >= 500 and allows sports)
    const results = filterVenues(SAMPLE_VENUES, {
      ...INITIAL_FILTERS,
      eventType: 'sports',
      attendance: 500,
    });

    expect(results).toHaveLength(0);
  });

  it('matches facilities using fuzzy/alias keywords', () => {
    expect(matchesFacility('WiFi', ['Fiber Gigabit WiFi'])).toBe(true);
    expect(matchesFacility('Projector & Screen', ['Projector & 4K Screen'])).toBe(true);
    expect(matchesFacility('PA Sound System', ['Scoreboard & PA System'])).toBe(true);
    expect(matchesFacility('Nonexistent Equipment', ['WiFi', 'Stage'])).toBe(false);
  });
});
