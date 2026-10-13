/**
 * Converts a 24-hour HH:mm time string into a 12-hour formatted string (e.g. "05:00 PM")
 */
export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24 || '--:--';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  if (isNaN(h) || isNaN(m)) return time24;

  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const hDisplay = String(h12).padStart(2, '0');
  const mDisplay = String(m).padStart(2, '0');

  return `${hDisplay}:${mDisplay} ${ampm}`;
}

/**
 * Parses a 24-hour HH:mm string into 12-hour components
 */
export function parseTime24Hour(time24: string): {
  hour12: number;
  minute: number;
  ampm: 'AM' | 'PM';
} {
  if (!time24 || !time24.includes(':')) {
    return { hour12: 5, minute: 0, ampm: 'PM' };
  }
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return { hour12, minute: m, ampm };
}

/**
 * Converts 12-hour components into a 24-hour HH:mm string
 */
export function toTime24Hour(hour12: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (ampm === 'PM') {
    h += 12;
  }
  const hStr = String(h).padStart(2, '0');
  const mStr = String(minute).padStart(2, '0');
  return `${hStr}:${mStr}`;
}

export interface TimeSlotOption {
  time24: string;
  time12: string;
  label: string;
  isEvening: boolean;
}

/**
 * Generates an array of time slot options between startHour and endHour (default 8 to 22)
 */
export function generateTimeSlots(
  startHour: number = 8,
  endHour: number = 22,
  intervalMinutes: number = 30
): TimeSlotOption[] {
  const slots: TimeSlotOption[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      if (hour === endHour && min > 0) break;

      const time24 = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const time12 = formatTime12Hour(time24);
      const isEvening = hour >= 17;

      slots.push({
        time24,
        time12,
        label: time12,
        isEvening,
      });
    }
  }

  return slots;
}
