import { BookingPeriod } from '@/types';

export function formatINR(amount: number | string | undefined | null): string {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

export function minutesToLabel(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function minutesTo24(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function toMinutes(hhmm: string): number | null {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatSlotTime(startMinute: number | null | undefined): string {
  return minutesToLabel(startMinute);
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateCompact(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = fromISO(dateISO);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function isToday(dateISO: string): boolean {
  return dateISO === todayISO();
}

export function periodLabel(period: BookingPeriod): string {
  switch (period) {
    case 'morning':
      return 'Morning';
    case 'afternoon':
      return 'Afternoon';
    case 'evening':
      return 'Evening';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#d97706';
    case 'confirmed':
      return '#0ea5e9';
    case 'completed':
      return '#16a34a';
    case 'cancelled':
    case 'declined':
    case 'no-show':
      return '#dc2626';
    default:
      return '#5b5f7e';
  }
}

export const DAY_LABELS: Record<string, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

export const DAY_SHORT: Record<string, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function daysUntil(dateISO: string): number {
  const now = fromISO(todayISO());
  const target = fromISO(dateISO);
  const diff = Math.round((target.getTime() - now.getTime()) / 86400000);
  return diff;
}

export function fromISOString(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fromISO(iso);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function formatDateISO(dateISO: string | null | undefined): string {
  if (!dateISO) return '—';
  return formatDateShort(fromISOString(dateISO));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = fromISOString(iso);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1d ago' : `${days}d ago`;
}