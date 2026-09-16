export interface ValidationErrors {
  [key: string]: string;
}

export function required(value: string | undefined | null, label: string): string | null {
  if (!value || !value.trim()) return `${label} is required`;
  return null;
}

export function email(value: string): string | null {
  if (!value || !value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function phone(value: string): string | null {
  if (!value || !value.trim()) return 'Phone number is required';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number';
  return null;
}

export function minLength(value: string, min: number, label: string): string | null {
  if (value && value.trim().length < min) return `${label} must be at least ${min} characters`;
  return null;
}

export function positiveNumber(value: number | string | undefined | null, label: string): string | null {
  const n = Number(value);
  if (value == null || value === '' || isNaN(n) || n < 0) return `${label} must be a positive number`;
  return null;
}

export function nonNegativeInteger(value: number | string | undefined | null, label: string): string | null {
  const n = Number(value);
  if (value == null || value === '' || isNaN(n) || n < 0 || !Number.isInteger(n)) return `${label} must be a whole number (0 or more)`;
  return null;
}

export function validTimeRange(start: string, end: string, openTime: string, closeTime: string): string | null {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s = toMin(start);
  const e = toMin(end);
  const o = toMin(openTime);
  const c = toMin(closeTime);
  if (s >= e) return 'End time must be after start time';
  if (s < o) return 'Start time is before opening';
  if (e > c) return 'End time is after closing';
  return null;
}

export function noTimeOverlap(startA: string, endA: string, existing: Array<{ start: string; end: string }>, excludeIndex?: number): string | null {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const aS = toMin(startA);
  const aE = toMin(endA);
  for (let i = 0; i < existing.length; i++) {
    if (excludeIndex != null && i === excludeIndex) continue;
    const bS = toMin(existing[i].start);
    const bE = toMin(existing[i].end);
    if (aS < bE && aE > bS) {
      return 'This time overlaps with an existing entry';
    }
  }
  return null;
}