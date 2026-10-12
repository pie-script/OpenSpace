import type { Venue, BookingRequest, Role, AppNotification } from '../types';
import { SAMPLE_VENUES } from '../data/sampleVenues';

const VENUES_KEY = 'openspace_demo_venues_v1';
const REQUESTS_KEY = 'openspace_demo_requests_v1';
const ROLE_KEY = 'openspace_demo_role_v1';
const NOTIFICATIONS_KEY = 'openspace_demo_notifications_v1';

export const INITIAL_DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    title: 'Booking Approved: Spring Concert Rehearsal',
    message: 'Oakridge Community High School approved your reservation for Sunday, Oct 18 (18:30–21:00). Lighting and keycard will be prepared.',
    timestamp: '2026-10-12T14:30:00Z',
    read: false,
    type: 'approved',
    targetRole: 'organizer',
    requestId: 'req-demo-01',
    venueId: 'venue-oakridge-auditorium',
  },
  {
    id: 'notif-02',
    title: 'Schedule Conflict Overlap Detected',
    message: '"Community Jazz Workshop & Jam" request conflicts with approved booking "Spring Concert Rehearsal" at Oakridge Auditorium.',
    timestamp: '2026-10-12T11:05:00Z',
    read: false,
    type: 'conflict',
    targetRole: 'staff',
    requestId: 'req-demo-04',
    venueId: 'venue-oakridge-auditorium',
  },
  {
    id: 'notif-03',
    title: 'Booking Notice: Weekend Game Jam Declined',
    message: 'Staff declined request: Exceeds lab electrical draw guidelines. Community requests must register with faculty supervisor.',
    timestamp: '2026-10-10T11:20:00Z',
    read: true,
    type: 'declined',
    targetRole: 'organizer',
    requestId: 'req-demo-05',
    venueId: 'venue-lincoln-media-lab',
  },
  {
    id: 'notif-04',
    title: 'Welcome to OpenSpace Civic Booking',
    message: 'Browse vetted community facilities or switch to Institution Staff in the top bar to review incoming permit requests.',
    timestamp: '2026-10-09T08:00:00Z',
    read: true,
    type: 'info',
    targetRole: 'all',
  },
];

// Initial realistic demo requests demonstrating all lifecycle states and conflict detection
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
  {
    id: 'req-demo-04',
    venueId: 'venue-oakridge-auditorium',
    organizerName: 'Oakridge Jazz Society',
    contactEmail: 'jazz.collective@example.org',
    eventName: 'Community Jazz Workshop & Jam',
    eventType: 'workshop',
    date: '2026-10-18', // Same date and overlapping time with req-demo-01!
    startTime: '19:00',
    endTime: '21:30',
    attendance: 60,
    soundLevel: 'amplified',
    status: 'Pending',
    createdAt: '2026-10-12T11:00:00Z',
  },
  {
    id: 'req-demo-05',
    venueId: 'venue-lincoln-media-lab',
    organizerName: 'Indie Game Creators Guild',
    contactEmail: 'guild@indiegames.example.org',
    eventName: 'Weekend Game Jam & Showcase',
    eventType: 'community',
    date: '2026-10-19',
    startTime: '18:00',
    endTime: '21:00',
    attendance: 35,
    soundLevel: 'moderate',
    status: 'Declined',
    staffNote: 'Denied: Exceeds lab electrical draw guidelines; community requests must register with faculty supervisor.',
    createdAt: '2026-10-09T18:00:00Z',
  },
  {
    id: 'req-demo-06',
    venueId: 'venue-greenfield-commons',
    organizerName: 'Greenfield Garden Coalition',
    contactEmail: 'gardeners@greenfield.example.org',
    eventName: 'Autumn Seed Swap & Workshop',
    eventType: 'community',
    date: '2026-10-25',
    startTime: '10:00',
    endTime: '13:00',
    attendance: 45,
    soundLevel: 'low',
    status: 'Cancelled',
    staffNote: 'Cancelled by organizer: Rescheduled due to outdoor garden conflict.',
    createdAt: '2026-10-08T10:00:00Z',
  },
];

// In-memory fallback if localStorage is unavailable
let memoryVenues: Venue[] | null = null;
let memoryRequests: BookingRequest[] | null = null;
let memoryNotifications: AppNotification[] | null = null;
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

export function getStoredNotifications(): AppNotification[] {
  if (hasLocalStorage()) {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
    } catch {
      // Fallback below
    }
  }
  if (!memoryNotifications) {
    memoryNotifications = [...INITIAL_DEMO_NOTIFICATIONS];
  }
  return memoryNotifications;
}

export function saveStoredNotifications(notifications: AppNotification[]): void {
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch {
      // Fallback
    }
  }
  memoryNotifications = notifications;
}

export function resetToDemoDefaults(): {
  venues: Venue[];
  requests: BookingRequest[];
  role: Role;
  notifications: AppNotification[];
} {
  if (hasLocalStorage()) {
    try {
      localStorage.setItem(VENUES_KEY, JSON.stringify(SAMPLE_VENUES));
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
      localStorage.setItem(ROLE_KEY, 'organizer');
    } catch {
      // Fallback
    }
  }
  memoryVenues = [...SAMPLE_VENUES];
  memoryRequests = [...INITIAL_DEMO_REQUESTS];
  memoryNotifications = [...INITIAL_DEMO_NOTIFICATIONS];
  memoryRole = 'organizer';

  return {
    venues: SAMPLE_VENUES,
    requests: INITIAL_DEMO_REQUESTS,
    role: 'organizer',
    notifications: INITIAL_DEMO_NOTIFICATIONS,
  };
}
