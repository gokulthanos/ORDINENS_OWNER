import { Booking, BookingPeriod, DayKey, Service, Shop, ShopHoliday } from '@/types';
import { toMinutes } from '@/utils/format';
import { fromISO } from '@/utils/format';

export const SLOT_STEP = 30;
export const PERIODS: BookingPeriod[] = ['morning', 'afternoon', 'evening'];
export const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/* ------------------------------ Helpers ------------------------------ */

export function slotMinute(hhmm: string | null | undefined): number | null {
  return toMinutes(hhmm ?? '');
}

function minutesToPeriod(minute: number): BookingPeriod {
  if (minute < 12 * 60) return 'morning';
  if (minute < 16 * 60) return 'afternoon';
  return 'evening';
}

function normalizeShop(shop: Shop | null) {
  if (!shop) return null;
  const workingHours = shop.workingHours || {};
  const capacity = Number(shop.capacity) || 1;
  const breaks = Array.isArray(shop.breaks) ? shop.breaks : [];
  return { ...shop, workingHours, capacity, breaks };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

/* ---------------------------- Configuration -------------------------- */

export function isHolidayOn(holidays: ShopHoliday[], dateISO: string): boolean {
  return holidays.some((h) => h.holiday_date === dateISO || (h as unknown as { dateISO?: string }).dateISO === dateISO);
}

export function shopOpenOn(shop: Shop | null, dateISO: string, holidays: ShopHoliday[] = []): boolean {
  if (!shop) return false;
  if (isHolidayOn(holidays, dateISO)) return false;
  const day = fromISO(dateISO).getDay();
  const dayKey = DAY_NAMES[day] as DayKey;
  const wh = shop.workingHours || {};
  const dayCfg = wh[dayKey];
  return Boolean(dayCfg && dayCfg.open);
}

export function shopDayHours(shop: Shop, dateISO: string) {
  const day = fromISO(dateISO).getDay();
  const dayKey = DAY_NAMES[day] as DayKey;
  const wh = shop.workingHours || {};
  const dayCfg = wh[dayKey] || { open: false, start: '09:00', end: '21:00' };
  return {
    openMinute: slotMinute(dayCfg.start),
    closeMinute: slotMinute(dayCfg.end),
  };
}

export function shopBreakBlocks(shop: Shop | null) {
  return (shop && Array.isArray(shop.breaks) ? shop.breaks : []).map((br) => ({
    start: slotMinute(br.start),
    end: slotMinute(br.end),
  }));
}

export function overlapsBreak(shop: Shop | null, start: number, duration: number) {
  const end = start + duration;
  return shopBreakBlocks(shop).some(
    (b) => b.start != null && b.end != null && overlaps(start, end, b.start, b.end)
  );
}

/**
 * How many confirmed booking "seats" are occupied during [start, start+duration).
 * Matches the existing countConcurrent logic (peak overlap on the slot step).
 */
export function countConcurrent(
  bookings: Booking[],
  shopId: string,
  dateISO: string,
  start: number,
  duration: number,
  ignoreBookingId?: string
): number {
  const relevant = bookings.filter(
    (b) =>
      b.shopId === shopId &&
      b.dateISO === dateISO &&
      b.status === 'confirmed' &&
      b.startMinute != null &&
      (ignoreBookingId == null || b.id !== ignoreBookingId)
  );
  let peak = 0;
  for (let t = start; t < start + duration; t += SLOT_STEP) {
    let count = 0;
    for (const b of relevant) {
      if (b.startMinute !== null && b.startMinute !== undefined && t >= b.startMinute && t < b.startMinute + (b.duration ?? 0)) count++;
    }
    if (count > peak) peak = count;
  }
  return peak;
}

/**
 * Generate the valid exact-time slots for an appointment on the requested date.
 * Same engine the customer app uses: working hours, breaks, holidays,
 * capacity/staff, service duration and existing confirmed bookings.
 *
 * `period` is optional. When provided it restricts to the classic
 * morning/afternoon/evening window; otherwise the full working day is used.
 */
export function generateSlots({
  shop,
  service,
  dateISO,
  period,
  ignoreBookingId,
  confirmedBookings,
  holidays,
}: {
  shop: Shop | null;
  service: Pick<Service, 'duration' | 'duration_minutes'> | null;
  dateISO: string;
  period?: BookingPeriod;
  ignoreBookingId?: string;
  confirmedBookings?: Booking[];
  holidays?: ShopHoliday[];
}): number[] {
  const s = normalizeShop(shop);
  if (!s || !service) return [];
  if (!shopOpenOn(s, dateISO, holidays)) return [];
  const { openMinute, closeMinute } = shopDayHours(s, dateISO);
  if (openMinute == null || closeMinute == null || closeMinute <= openMinute) return [];

  const capacity = Math.max(1, s.capacity);
  const step = Math.max(15, Number(s.slot_interval) || SLOT_STEP);
  const duration = Number(service.duration_minutes || service.duration) || 30;

  let start = openMinute;
  let end = closeMinute;
  if (period) {
    const periodRange: Record<BookingPeriod, [number, number]> = {
      morning: [openMinute, Math.min(12 * 60, closeMinute)],
      afternoon: [Math.max(12 * 60, openMinute), Math.min(16 * 60, closeMinute)],
      evening: [Math.max(16 * 60, openMinute), closeMinute],
    };
    const [pStart, pEnd] = periodRange[period];
    start = Math.max(openMinute, pStart);
    end = Math.min(closeMinute, pEnd);
  }

  const bookings = confirmedBookings ?? [];
  const slots: number[] = [];
  for (let t = start; t + duration <= end; t += step) {
    if (overlapsBreak(s, t, duration)) continue;
    if (countConcurrent(bookings, s.id, dateISO, t, duration, ignoreBookingId) >= capacity) continue;
    slots.push(t);
  }
  return slots;
}

/**
 * Final availability re-check before confirming a pending booking.
 * Returns true only if the slot is still genuinely available.
 */
export function isSlotAvailable({
  shop,
  dateISO,
  startMinute,
  duration,
  service,
  ignoreBookingId,
  confirmedBookings,
  holidays,
}: {
  shop: Shop | null;
  dateISO: string;
  startMinute: number;
  duration: number;
  service: Pick<Service, 'duration' | 'duration_minutes'> | null;
  ignoreBookingId?: string;
  confirmedBookings?: Booking[];
  holidays?: ShopHoliday[];
}): boolean {
  const s = normalizeShop(shop);
  if (!s || !service) return false;
  if (!shopOpenOn(s, dateISO, holidays)) return false;
  const { openMinute, closeMinute } = shopDayHours(s, dateISO);
  if (openMinute == null || closeMinute == null) return false;
  if (startMinute < openMinute || startMinute + duration > closeMinute) return false;
  if (overlapsBreak(s, startMinute, duration)) return false;
  const capacity = Math.max(1, s.capacity);
  const bookings = confirmedBookings ?? [];
  return countConcurrent(bookings, s.id, dateISO, startMinute, duration, ignoreBookingId) < capacity;
}

export function periodAvailability({
  shop,
  service,
  dateISO,
  confirmedBookings,
  holidays,
}: {
  shop: Shop | null;
  service: Pick<Service, 'duration' | 'duration_minutes'> | null;
  dateISO: string;
  confirmedBookings?: Booking[];
  holidays?: ShopHoliday[];
}): Record<BookingPeriod, 'available' | 'limited' | 'full'> {
  const s = normalizeShop(shop);
  if (!s || !service || !shopOpenOn(s, dateISO, holidays)) {
    return { morning: 'full', afternoon: 'full', evening: 'full' };
  }
  const out: Record<BookingPeriod, 'available' | 'limited' | 'full'> = {
    morning: 'full',
    afternoon: 'full',
    evening: 'full',
  };
  for (const period of PERIODS) {
    const slots = generateSlots({ shop: s, service, dateISO, period, confirmedBookings, holidays });
    if (slots.length === 0) out[period] = 'full';
    else if (slots.length <= Math.max(1, s.capacity)) out[period] = 'limited';
    else out[period] = 'available';
  }
  return out;
}

export function formatSlotTime(startMinute: number | null | undefined): string {
  return minutesToLabel(startMinute);
}

function minutesToLabel(startMinute: number | null | undefined): string {
  if (startMinute == null) return '—';
  const h = Math.floor(startMinute / 60);
  const m = startMinute % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function toPeriod(startMinute: number): BookingPeriod {
  return minutesToPeriod(startMinute);
}