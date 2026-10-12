import type { Venue, BookingRequest, Role } from '../types';
import { SAMPLE_VENUES } from '../data/sampleVenues';

const VENUES_KEY = 'openspace_demo_venues_v1';
const REQUESTS_KEY = 'openspace_demo_requests_v1';
const ROLE_KEY = 'openspace_demo_role_v1';

// Initial realistic demo requests to demonstrate staff flow & status tracking
export const INITIAL_DEMO_REQUESTS: BookingRequest[] = [
  {
    id: 'req-demo-01',
    venueId: 'venue-oakridge-auditorium',
    organizerName: 'Civic Youth Philharmonic',
    contactEmail: 'youth.orchestra@example.org',
    eventName: 'Spring Concert Rehearsal',
    eventType: 'rehearsal',
    date: '2026-10-18',
    startTime: '18:30',
    endTime: '21:00',
    attendance: 85,
    soundLevel: 'amplified',
    status: 'Approved',
    staffNote: 'Stage lighting unlocked and keycard left with security guard.',
    createdAt: '2026-10-10T14:20:00Z',
  },
  {
    id: 'req-demo-02',
    venueId: 'venue-westside-gym',
    organizerName: 'Westside Youth Basketball Club',
    contactEmail: 'coach.marcus@example.org',
    eventName: 'Under-16 Regional Skills Camp',
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
    id: 'req-demo-03',
    venueId: 'venue-metro-lecture-hall',
    organizerName: 'Open Source Developer Group',
    contactEmail: 'organizers@metro-devs.example.org',
    eventName: 'Full-Stack Web Architecture Seminar',
    eventType: 'lecture',
    date: '2026-10-22',
    startTime: '19:00',
    endTime: '21:30',
    attendance: 95,
    soundLevel: 'moderate',
    status: 'Pending',
    createdAt: '2026-10-11T16:45:00Z',
  },
];

// In-memory fallback if localStorage is unavailable
let memoryVenues: Venue[] | null = null;
let memoryRequests: BookingRequest[] | null = null;
let memoryRole: Role = 'organizer';

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getStoredVenues(): Venue[] {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(VENUES_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem(VENUES_KEY, JSON.stringify(SAMPLE_VENUES));
    } catch {
      // Fallback below
    }
  }
  if (!memoryVenues) {
    memoryVenues = [...SAMPLE_VENUES];
  }
  return memoryVenues;
}

export function saveStoredVenues(venues: Venue[]): void {
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(VENUES_KEY, JSON.stringify(venues));
    } catch {
      // Fallback
    }
  }
  memoryVenues = venues;
}

export function getStoredRequests(): BookingRequest[] {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(REQUESTS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
    } catch {
      // Fallback below
    }
  }
  if (!memoryRequests) {
    memoryRequests = [...INITIAL_DEMO_REQUESTS];
  }
  return memoryRequests;
}

export function saveStoredRequests(requests: BookingRequest[]): void {
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    } catch {
      // Fallback
    }
  }
  memoryRequests = requests;
}

export function getStoredRole(): Role {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(ROLE_KEY);
      if (raw === 'organizer' || raw === 'staff') {
        return raw;
      }
    } catch {
      // Fallback
    }
  }
  return memoryRole;
}

export function saveStoredRole(role: Role): void {
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(ROLE_KEY, role);
    } catch {
      // Fallback
    }
  }
  memoryRole = role;
}

export function resetToDemoDefaults(): { venues: Venue[]; requests: BookingRequest[]; role: Role } {
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(VENUES_KEY, JSON.stringify(SAMPLE_VENUES));
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
      localStorage.setItem(ROLE_KEY, 'organizer');
    } catch {
      // Fallback
    }
  }
  memoryVenues = [...SAMPLE_VENUES];
  memoryRequests = [...INITIAL_DEMO_REQUESTS];
  memoryRole = 'organizer';

  return {
    venues: SAMPLE_VENUES,
    requests: INITIAL_DEMO_REQUESTS,
    role: 'organizer',
  };
}
