import type { Venue, VenueFilterState, EventType } from '../types';

export const COMMON_FACILITIES = [
  'WiFi',
  'Projector & Screen',
  'PA Sound System',
  'Wheelchair Accessible',
  'Parking / Transit',
  'Stage Lighting',
  'Sports Amenities',
  'Kitchenette / Catering',
] as const;

export const INITIAL_FILTERS: VenueFilterState = {
  date: '',
  eventType: 'all',
  attendance: '',
  facilities: [],
};

export function matchesFacility(facilityQuery: string, venueFacilities: string[]): boolean {
  const q = facilityQuery.toLowerCase();

  return venueFacilities.some((fac) => {
    const f = fac.toLowerCase();
    if (f.includes(q)) return true;

    if (q.includes('wifi') && (f.includes('wifi') || f.includes('fiber'))) return true;
    if (
      q.includes('projector') &&
      (f.includes('projector') || f.includes('screen') || f.includes('presentation') || f.includes('touchscreen'))
    )
      return true;
    if (
      (q.includes('sound') || q.includes('pa')) &&
      (f.includes('pa') || f.includes('sound') || f.includes('microphone') || f.includes('audio') || f.includes('speaker'))
    )
      return true;
    if (
      q.includes('accessible') &&
      (f.includes('accessible') || f.includes('ramp') || f.includes('wheelchair'))
    )
      return true;
    if (q.includes('parking') && (f.includes('parking') || f.includes('transit'))) return true;
    if (q.includes('stage') && (f.includes('stage') || f.includes('green room'))) return true;
    if (
      q.includes('sports') &&
      (f.includes('court') ||
        f.includes('floor') ||
        f.includes('basketball') ||
        f.includes('gym') ||
        f.includes('bleacher'))
    )
      return true;
    if (q.includes('kitchen') && (f.includes('kitchen') || f.includes('catering') || f.includes('sink')))
      return true;

    return false;
  });
}

export function filterVenues(venues: Venue[], filters: VenueFilterState): Venue[] {
  return venues.filter((venue) => {
    // 1. Date check (day of the week outside academic hours)
    if (filters.date) {
      const [yearStr, monthStr, dayStr] = filters.date.split('-');
      if (yearStr && monthStr && dayStr) {
        const year = Number(yearStr);
        const month = Number(monthStr) - 1;
        const day = Number(dayStr);
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 1 is Monday...

        if (!venue.rules.operatingDays.includes(dayOfWeek)) {
          return false;
        }
      }
    }

    // 2. Event type check
    if (filters.eventType && filters.eventType !== 'all') {
      const allowed = venue.rules.allowedEventTypes.includes(filters.eventType as EventType);
      if (!allowed) {
        return false;
      }
    }

    // 3. Attendance check (must fit requested attendee count)
    if (typeof filters.attendance === 'number' && filters.attendance > 0) {
      if (venue.capacity < filters.attendance) {
        return false;
      }
    }

    // 4. Facilities check (all selected facilities must be present)
    if (filters.facilities.length > 0) {
      const allFacilitiesMatch = filters.facilities.every((facilityQuery) =>
        matchesFacility(facilityQuery, venue.facilities)
      );
      if (!allFacilitiesMatch) {
        return false;
      }
    }

    return true;
  });
}

export function getActiveFilterCount(filters: VenueFilterState): number {
  let count = 0;
  if (filters.date) count += 1;
  if (filters.eventType && filters.eventType !== 'all') count += 1;
  if (typeof filters.attendance === 'number' && filters.attendance > 0) count += 1;
  count += filters.facilities.length;
  return count;
}
