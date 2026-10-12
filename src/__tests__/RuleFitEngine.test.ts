import { describe, it, expect } from 'vitest';
import { checkVenueFit } from '../utils/checkVenueFit';
import { SAMPLE_VENUES } from '../data/sampleVenues';
import type { EventParameters } from '../types';

describe('Venue Rules and Policy Fit Engine', () => {
  const oakridgeAuditorium = SAMPLE_VENUES.find((v) => v.id === 'venue-oakridge-auditorium')!;
  const westsideGym = SAMPLE_VENUES.find((v) => v.id === 'venue-westside-gym')!;
  const stJudeSeminar = SAMPLE_VENUES.find((v) => v.id === 'venue-stjude-seminar-room')!;
  const centralLibrary = SAMPLE_VENUES.find((v) => v.id === 'venue-central-library-atrium')!;

  // 1. Operating Hours & Boundary Times
  describe('Operating Hours and Boundary Validation', () => {
    it('rejects an event starting before permitted outside-academic hours with an explanation', () => {
      // Oakridge weekday hours: 18:00–22:00
      const params: EventParameters = {
        eventType: 'lecture',
        date: '2026-10-23', // Friday
        startTime: '17:30', // 30 min before 18:00 opening
        endTime: '20:00',
        attendance: 100,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(oakridgeAuditorium, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'operatingHours');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/access on weekdays begins at 18:00/i);
    });

    it('rejects an event ending after latest permitted closing time with an explanation', () => {
      // Oakridge closes at 22:00 on weekdays
      const params: EventParameters = {
        eventType: 'lecture',
        date: '2026-10-23', // Friday
        startTime: '20:00',
        endTime: '22:30', // 30 min after 22:00
        attendance: 100,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(oakridgeAuditorium, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'operatingHours');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/latest closing time of 22:00/i);
    });

    it('rejects an invalid event time range where end time is before or equal to start time', () => {
      const params: EventParameters = {
        eventType: 'lecture',
        date: '2026-10-23',
        startTime: '20:00',
        endTime: '19:00',
        attendance: 50,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(oakridgeAuditorium, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'operatingHours');
      expect(violation?.title).toMatch(/invalid event time range/i);
    });

    it('accepts exact boundary times matching opening and closing hours', () => {
      // Westside Gym weekday hours: 18:30–22:00, max duration 3 hours
      // An event exactly 18:30 to 21:30 (3h)
      const params: EventParameters = {
        eventType: 'sports',
        date: '2026-10-23', // Friday
        startTime: '18:30', // Exact open
        endTime: '21:30', // 3 hours
        attendance: 100,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(westsideGym, params);
      const hourViolations = result.violations.filter((v) => v.rule === 'operatingHours');
      expect(hourViolations).toHaveLength(0);
    });
  });

  // 2. Operating Days
  describe('Operating Days Rule', () => {
    it('rejects request on a day the venue is closed outside academic hours with an explanation', () => {
      // Oakridge operates Mon-Sat [1,2,3,4,5,6], closed on Sunday [0]
      // 2026-10-18 is a Sunday
      const params: EventParameters = {
        eventType: 'performance',
        date: '2026-10-18', // Sunday
        startTime: '14:00',
        endTime: '17:00',
        attendance: 150,
        soundLevel: 'amplified',
      };

      const result = checkVenueFit(oakridgeAuditorium, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'operatingDays');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/closed on sundays/i);
    });
  });

  // 3. Maximum Event Duration
  describe('Maximum Duration Rule', () => {
    it('rejects an event exceeding maximum duration limit with an explanation', () => {
      // Westside Gym max duration is 3 hours
      const params: EventParameters = {
        eventType: 'sports',
        date: '2026-10-24', // Saturday
        startTime: '09:00',
        endTime: '13:00', // 4 hours
        attendance: 50,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(westsideGym, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'maxDuration');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/exceeds the venue's permitted limit of 3 hours/i);
    });

    it('accepts an event with exact maximum permitted duration', () => {
      // Oakridge max duration is 4 hours
      const params: EventParameters = {
        eventType: 'rehearsal',
        date: '2026-10-23', // Friday
        startTime: '18:00',
        endTime: '22:00', // Exactly 4.0 hours
        attendance: 80,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(oakridgeAuditorium, params);
      const durationViolations = result.violations.filter((v) => v.rule === 'maxDuration');
      expect(durationViolations).toHaveLength(0);
    });
  });

  // 4. Allowed Event Types
  describe('Allowed Event Types Rule', () => {
    it('rejects an event activity the venue disallows with an explanation', () => {
      // Westside Gym only allows ['sports', 'workshop', 'community'], disallows 'performance'
      const params: EventParameters = {
        eventType: 'performance',
        date: '2026-10-23',
        startTime: '19:00',
        endTime: '21:00',
        attendance: 100,
        soundLevel: 'moderate',
      };

      const result = checkVenueFit(westsideGym, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'eventType');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/does not permit 'performance' activities/i);
      expect(violation?.explanation).toMatch(/sports, workshop, community/i);
    });
  });

  // 5. Maximum Attendance & Capacity
  describe('Capacity and Attendance Rule', () => {
    it('rejects attendance exceeding venue capacity with an explanation', () => {
      // St. Jude Seminar Room capacity is 45
      const params: EventParameters = {
        eventType: 'workshop',
        date: '2026-10-23',
        startTime: '18:00',
        endTime: '20:00',
        attendance: 50, // 50 > 45
        soundLevel: 'low',
      };

      const result = checkVenueFit(stJudeSeminar, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'maxAttendance');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/exceeds the maximum room capacity of 45/i);
    });

    it('accepts attendance at exact boundary capacity', () => {
      const params: EventParameters = {
        eventType: 'meeting',
        date: '2026-10-23',
        startTime: '18:00',
        endTime: '20:00',
        attendance: 45, // Exact capacity 45
        soundLevel: 'low',
      };

      const result = checkVenueFit(stJudeSeminar, params);
      const capacityViolations = result.violations.filter((v) => v.rule === 'maxAttendance');
      expect(capacityViolations).toHaveLength(0);
    });
  });

  // 6. Sound Level Policy
  describe('Sound Level Rule', () => {
    it('rejects sound level exceeding venue allowance with an explanation', () => {
      // Central Library max sound level is 'moderate', request is 'amplified'
      const params: EventParameters = {
        eventType: 'performance',
        date: '2026-10-24', // Saturday
        startTime: '14:00',
        endTime: '17:00',
        attendance: 80,
        soundLevel: 'amplified',
      };

      const result = checkVenueFit(centralLibrary, params);
      expect(result.isFit).toBe(false);
      const violation = result.violations.find((v) => v.rule === 'soundLevel');
      expect(violation).toBeDefined();
      expect(violation?.explanation).toMatch(/only permit up to 'moderate' sound/i);
    });

    it('accepts low sound in a moderate or amplified sound venue', () => {
      const params: EventParameters = {
        eventType: 'meeting',
        date: '2026-10-23',
        startTime: '18:30',
        endTime: '20:30',
        attendance: 20,
        soundLevel: 'low',
      };

      const result = checkVenueFit(centralLibrary, params);
      const soundViolations = result.violations.filter((v) => v.rule === 'soundLevel');
      expect(soundViolations).toHaveLength(0);
    });
  });

  // 7. Request Meeting All Configured Rules
  describe('Complete Rule Compatibility', () => {
    it('marks a compliant request as a fit and identifies required conditions', () => {
      // Oakridge Auditorium: allows performance, Mon-Sat, 18:00-22:00, max 4h, capacity 350, amplified
      const params: EventParameters = {
        eventType: 'performance',
        date: '2026-10-23', // Friday
        startTime: '18:30',
        endTime: '21:30', // 3h <= 4h
        attendance: 200, // 200 <= 350
        soundLevel: 'amplified', // amplified <= amplified
      };

      const result = checkVenueFit(oakridgeAuditorium, params);
      expect(result.isFit).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.conditions).toContain(
        'On-site campus facilities supervisor required during occupancy'
      );
      expect(result.conditions).toContain(
        'Refundable campus cleanup and security deposit required'
      );
    });
  });

  // 8. The Same Request Fits One Venue and Fails Another
  describe('Differential Venue Fit', () => {
    it('evaluates the same request as a fit for one venue and a failure for another based on their distinct rules', () => {
      // Request: Youth Symphony Rehearsal
      // Friday 18:30–21:30, 80 attendees, rehearsal, amplified sound
      const request: EventParameters = {
        eventType: 'rehearsal',
        date: '2026-10-23', // Friday
        startTime: '18:30',
        endTime: '21:30',
        attendance: 80,
        soundLevel: 'amplified',
      };

      // Oakridge Auditorium: Allows rehearsal, open Fri 18:00-22:00, capacity 350, permits amplified sound
      const fitAuditorium = checkVenueFit(oakridgeAuditorium, request);
      expect(fitAuditorium.isFit).toBe(true);
      expect(fitAuditorium.violations).toHaveLength(0);

      // Westside Gymnasium: Does NOT allow 'rehearsal' (only sports/workshop/community)
      const fitGym = checkVenueFit(westsideGym, request);
      expect(fitGym.isFit).toBe(false);
      expect(fitGym.violations.some((v) => v.rule === 'eventType')).toBe(true);

      // St. Jude Seminar Room: Capacity 45 (attendance 80 exceeds), Sound max 'low' (amplified exceeds), eventType rehearsal disallowed
      const fitSeminar = checkVenueFit(stJudeSeminar, request);
      expect(fitSeminar.isFit).toBe(false);
      expect(fitSeminar.violations.length).toBeGreaterThanOrEqual(2);
      expect(fitSeminar.violations.some((v) => v.rule === 'maxAttendance')).toBe(true);
      expect(fitSeminar.violations.some((v) => v.rule === 'soundLevel')).toBe(true);
    });
  });
});
