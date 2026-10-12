import type { BookingRequest, Venue } from '../types';
import { timeToMinutes } from './checkVenueFit';

/**
 * Escapes a field for CSV according to RFC 4180
 */
export function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '""';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an RFC-compliant CSV string representing booking requests with venue details
 */
export function generateBookingsCSV(requests: BookingRequest[], venues: Venue[]): string {
  const headers = [
    'Request ID',
    'Event Title',
    'Facility',
    'Institution',
    'Organizer Name',
    'Contact Email',
    'Event Type',
    'Date',
    'Start Time',
    'End Time',
    'Duration (Hours)',
    'Attendance',
    'Noise Level',
    'Status',
    'Recurring Series',
    'Staff Note',
    'Created At',
  ];

  const venueMap = new Map(venues.map((v) => [v.id, v]));

  const rows = requests.map((req) => {
    const venue = venueMap.get(req.venueId);
    const startMins = timeToMinutes(req.startTime);
    const endMins = timeToMinutes(req.endTime);
    const durationHours = Math.max(0, (endMins - startMins) / 60).toFixed(1);
    const recurringText = req.seriesId
      ? `Occurrence ${req.occurrenceIndex || 1} of ${req.totalOccurrences || 'series'}`
      : 'Single Event';

    return [
      csvEscape(req.id),
      csvEscape(req.eventName),
      csvEscape(venue ? venue.name : req.venueId),
      csvEscape(venue ? venue.institutionName : ''),
      csvEscape(req.organizerName),
      csvEscape(req.contactEmail),
      csvEscape(req.eventType),
      csvEscape(req.date),
      csvEscape(req.startTime),
      csvEscape(req.endTime),
      csvEscape(durationHours),
      csvEscape(req.attendance),
      csvEscape(req.soundLevel),
      csvEscape(req.status),
      csvEscape(recurringText),
      csvEscape(req.staffNote || ''),
      csvEscape(req.createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Initiates browser file download for CSV content
 */
export function downloadCSV(csvContent: string, filename: string = 'openspace_bookings.csv'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * One-click helper to export requests to CSV
 */
export function exportBookingsToCSV(
  requests: BookingRequest[],
  venues: Venue[],
  filename?: string
): void {
  const csv = generateBookingsCSV(requests, venues);
  downloadCSV(csv, filename);
}

export interface VenueUsageSummary {
  venueId: string;
  venueName: string;
  institutionName: string;
  totalBookings: number;
  approvedBookings: number;
  approvedHours: number;
  estimatedRevenue: number;
}

export interface BookingsReportSummary {
  generatedAt: string;
  totalRequests: number;
  approvedCount: number;
  pendingCount: number;
  declinedCount: number;
  cancelledCount: number;
  totalApprovedHours: number;
  totalApprovedAttendance: number;
  totalEstimatedRevenue: number;
  venueSummaries: VenueUsageSummary[];
}

/**
 * Computes high-level usage and financial summary statistics for management reporting
 */
export function generateBookingsReportSummary(
  requests: BookingRequest[],
  venues: Venue[]
): BookingsReportSummary {
  let approvedCount = 0;
  let pendingCount = 0;
  let declinedCount = 0;
  let cancelledCount = 0;
  let totalApprovedHours = 0;
  let totalApprovedAttendance = 0;
  let totalEstimatedRevenue = 0;

  const venueMap = new Map<string, Venue>(venues.map((v) => [v.id, v]));
  const usageByVenue: Record<
    string,
    { total: number; approved: number; approvedHours: number; revenue: number }
  > = {};

  venues.forEach((v) => {
    usageByVenue[v.id] = { total: 0, approved: 0, approvedHours: 0, revenue: 0 };
  });

  requests.forEach((req) => {
    const venue = venueMap.get(req.venueId);
    const hourlyPrice = venue ? venue.hourlyPrice : 0;
    const startMins = timeToMinutes(req.startTime);
    const endMins = timeToMinutes(req.endTime);
    const hours = Math.max(0, (endMins - startMins) / 60);

    if (!usageByVenue[req.venueId]) {
      usageByVenue[req.venueId] = { total: 0, approved: 0, approvedHours: 0, revenue: 0 };
    }
    usageByVenue[req.venueId].total += 1;

    if (req.status === 'Approved') {
      approvedCount += 1;
      totalApprovedHours += hours;
      totalApprovedAttendance += req.attendance;
      const rev = Math.round(hours * hourlyPrice);
      totalEstimatedRevenue += rev;

      usageByVenue[req.venueId].approved += 1;
      usageByVenue[req.venueId].approvedHours += hours;
      usageByVenue[req.venueId].revenue += rev;
    } else if (req.status === 'Pending') {
      pendingCount += 1;
    } else if (req.status === 'Declined') {
      declinedCount += 1;
    } else if (req.status === 'Cancelled') {
      cancelledCount += 1;
    }
  });

  const venueSummaries: VenueUsageSummary[] = venues.map((venue) => {
    const usage = usageByVenue[venue.id] || { total: 0, approved: 0, approvedHours: 0, revenue: 0 };
    return {
      venueId: venue.id,
      venueName: venue.name,
      institutionName: venue.institutionName,
      totalBookings: usage.total,
      approvedBookings: usage.approved,
      approvedHours: Math.round(usage.approvedHours * 10) / 10,
      estimatedRevenue: usage.revenue,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalRequests: requests.length,
    approvedCount,
    pendingCount,
    declinedCount,
    cancelledCount,
    totalApprovedHours: Math.round(totalApprovedHours * 10) / 10,
    totalApprovedAttendance,
    totalEstimatedRevenue,
    venueSummaries,
  };
}
