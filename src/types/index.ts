export type Role = 'organizer' | 'staff';

export type InstitutionType = 'School' | 'University' | 'Library';

export type SoundLevel = 'low' | 'moderate' | 'amplified';

export type EventType =
  | 'meeting'
  | 'workshop'
  | 'rehearsal'
  | 'performance'
  | 'sports'
  | 'community'
  | 'lecture';

export interface VenueRules {
  allowedEventTypes: EventType[];
  operatingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  weekdayHours: { start: string; end: string };
  weekendHours: { start: string; end: string };
  maxDurationHours: number;
  maxAttendance: number;
  maxSoundLevel: SoundLevel;
  requiresSupervision: boolean;
  requiresCleanupDeposit: boolean;
  notes?: string;
}

export interface Venue {
  id: string;
  name: string;
  institutionName: string;
  institutionType: InstitutionType;
  description: string;
  address: string;
  city: string;
  capacity: number;
  hourlyPrice: number;
  facilities: string[];
  imageUrl: string;
  rules: VenueRules;
  isAvailable: boolean;
}

export type BookingStatus = 'Pending' | 'Approved' | 'Declined' | 'Cancelled';

export interface BookingRequest {
  id: string;
  venueId: string;
  organizerName: string;
  contactEmail: string;
  eventName: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  attendance: number;
  soundLevel: SoundLevel;
  status: BookingStatus;
  staffNote?: string;
  createdAt: string;
}

export type PageView = 'home' | 'venues' | 'venue-detail' | 'staff';

export interface VenueFilterState {
  date: string; // YYYY-MM-DD
  eventType: string; // 'all' or EventType
  attendance: number | ''; // minimum capacity required
  facilities: string[]; // selected facility keywords
}

export interface EventParameters {
  eventType: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  attendance: number;
  soundLevel: SoundLevel;
}

export type RuleViolationType =
  | 'operatingDays'
  | 'operatingHours'
  | 'maxDuration'
  | 'eventType'
  | 'maxAttendance'
  | 'soundLevel';

export interface RuleViolation {
  rule: RuleViolationType;
  title: string;
  explanation: string;
}

export interface FitCheckResult {
  isFit: boolean;
  violations: RuleViolation[];
  conditions: string[];
}
