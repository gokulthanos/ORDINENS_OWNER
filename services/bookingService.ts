import { Booking, BookingStatus, DashboardStats, Service, Shop, ShopHoliday } from '@/types';
import { STORAGE_KEYS, readJSON, writeJSON } from '@/utils/storage';
import { todayISO } from '@/utils/format';
import { getService } from './serviceService';
import { isSlotAvailable, generateSlots } from './slotService';

const LOCAL_KEY = STORAGE_KEYS.bookings;

/* ----------------------------- Storage ------------------------------- */

function belongsToShop(booking: Booking, shopId?: string): boolean {
  if (!shopId) return true;
  return booking.shopId === shopId || booking.shop_id === shopId;
}

async function getLocalBookings(): Promise<Booking[]> {
  return readJSON<Booking[]>(LOCAL_KEY, []);
}

async function setLocalBookings(list: Booking[]): Promise<Booking[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

/* ------------------------------ Queries ------------------------------ */

export async function getBookings(shopId?: string): Promise<Booking[]> {
  const all = await getLocalBookings();
  return shopId ? all.filter((b) => belongsToShop(b, shopId)) : all;
}

export async function getBooking(id: string, shopId?: string): Promise<Booking | null> {
  const all = await getLocalBookings();
  return all.find((b) => b.id === id && belongsToShop(b, shopId)) || null;
}

/**
 * Confirmed bookings for a given date in the shape the slot engine expects.
 * Used for availability checks and slot generation.
 */
export async function getConfirmedBookingsForDate(shopId: string, dateISO: string): Promise<Booking[]> {
  const all = await getLocalBookings();
  return all.filter((b) => belongsToShop(b, shopId) && b.dateISO === dateISO && b.status === 'confirmed' && b.startMinute != null);
}

/* --------------------------- Status changes -------------------------- */

async function persistLocalStatus(id: string, patch: Partial<Booking>, shopId?: string): Promise<Booking | null> {
  const list = await getLocalBookings();
  let updated: Booking | null = null;
  let found = false;
  const next = list.map((b) => {
    if (b.id === id) {
      found = true;
      if (!belongsToShop(b, shopId)) return b;
      updated = { ...b, ...patch };
      return updated;
    }
    return b;
  });
  if (!found || !updated) return null;
  await setLocalBookings(next);
  return updated;
}

export async function updateBookingStatus(id: string, status: BookingStatus, note?: string | null, allocatedBy?: string | null, shopId?: string): Promise<Booking | null> {
  const current = await getBooking(id, shopId);
  if (!current) return null;
  const now = new Date().toISOString();
  const patch: Partial<Booking> = { status, updated_at: now };
  if (status === 'confirmed') {
    patch.allocated_by = allocatedBy ?? current?.allocated_by ?? null;
  }
  if (status === 'cancelled' || status === 'declined') patch.cancelled_at = now;

  const updated = await persistLocalStatus(id, patch, shopId);
  return updated;
}

/* ------------------------- Confirm / Decline ------------------------- */

export interface ConfirmResult {
  ok: boolean;
  error?: string;
  booking?: Booking;
}

/**
 * Confirm a pending booking with a chosen start time.
 * ALWAYS re-checks availability against latest data (working hours,
 * breaks, holidays, existing confirmed bookings, service duration,
 * capacity/slot rules) before confirming. If the slot is no longer
 * available the booking is NOT confirmed.
 */
export async function confirmBooking(
  bookingId: string,
  startMinute: number,
  deps: {
    shop: Shop;
    holidays: ShopHoliday[];
    allocatedBy?: string | null;
  }
): Promise<ConfirmResult> {
  const latest = await getBooking(bookingId, deps.shop.id);
  if (!latest) return { ok: false, error: 'Unable to load the booking. Please try again.' };
  if (latest.status !== 'pending') {
    return { ok: false, error: 'This booking is no longer pending and cannot be confirmed.' };
  }

  const dateISO = latest.dateISO || latest.appointment_date;
  if (!dateISO) return { ok: false, error: 'This booking has no appointment date.' };

  const service = await resolveService(latest);
  if (!service) return { ok: false, error: 'The service for this booking is unavailable.' };

  const duration = Number(service.duration_minutes || service.duration) || 30;
  const confirmedBookings = await getConfirmedBookingsForDate(deps.shop.id, dateISO);

  const available = isSlotAvailable({
    shop: deps.shop,
    dateISO,
    startMinute,
    duration,
    service,
    ignoreBookingId: latest.id,
    confirmedBookings,
    holidays: deps.holidays,
  });

  if (!available) {
    return { ok: false, error: 'This slot is no longer available.' };
  }

  const endMinute = startMinute + duration;
  const now = new Date().toISOString();
  const patch: Partial<Booking> = {
    status: 'confirmed',
    confirmed_at: now,
    allocated_start_time: startMinute,
    startMinute,
    allocated_end_time: endMinute,
    allocated_by: deps.allocatedBy ?? null,
    updated_at: now,
  };

  const updated = await persistLocalStatus(latest.id, patch, deps.shop.id);
  return { ok: true, booking: updated ?? undefined };
}

export async function declineBooking(bookingId: string, allocatedBy?: string | null, reason?: string, shopId?: string): Promise<ConfirmResult> {
  const latest = await getBooking(bookingId, shopId);
  if (!latest) return { ok: false, error: 'Unable to load the booking. Please try again.' };
  if (latest.status !== 'pending') {
    return { ok: false, error: 'This booking is no longer pending and cannot be declined.' };
  }
  const updated = await updateBookingStatus(bookingId, 'declined', reason ?? null, allocatedBy ?? null, shopId);
  return { ok: Boolean(updated), booking: updated ?? undefined, error: updated ? undefined : 'Unable to decline the booking. Please try again.' };
}

async function resolveService(booking: Booking): Promise<Service | null> {
  if (booking.service_id || booking.serviceId) {
    try {
      const svc = await getService(booking.service_id ?? booking.serviceId ?? '', booking.shop_id ?? booking.shopId);
      if (svc) return svc;
    } catch {
      // fall through
    }
  }
  if (booking.duration || booking.service_duration || booking.serviceName || booking.price) {
    return {
      id: booking.service_id ?? booking.serviceId ?? '',
      name: booking.serviceName || 'Service',
      duration: booking.duration || booking.service_duration || 30,
      duration_minutes: booking.duration || booking.service_duration || 30,
      price: booking.price ?? 0,
      is_active: true,
    } as Service;
  }
  return null;
}

export async function getAvailableSlotsForBooking(
  bookingId: string,
  deps: { shop: Shop; holidays: ShopHoliday[] }
): Promise<number[]> {
  const booking = await getBooking(bookingId, deps.shop.id);
  if (!booking) return [];
  const dateISO = booking.dateISO || booking.appointment_date;
  if (!dateISO) return [];
  const service = await resolveService(booking);
  if (!service) return [];
  const confirmedBookings = await getConfirmedBookingsForDate(deps.shop.id, dateISO);
  return generateSlots({
    shop: deps.shop,
    service,
    dateISO,
    ignoreBookingId: booking.id,
    confirmedBookings,
    holidays: deps.holidays,
  });
}

/* ------------------------------ Stats -------------------------------- */

export async function getDashboardStats(shopId: string): Promise<DashboardStats> {
  const bookings = await getBookings(shopId);
  const today = todayISO();
  const stats: DashboardStats = {
    todayBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    declinedBookings: 0,
    revenue: 0,
  };
  for (const b of bookings) {
    if (b.status === 'pending') stats.pendingBookings++;
    if (b.status === 'confirmed') stats.confirmedBookings++;
    if (b.status === 'completed') {
      stats.completedBookings++;
      stats.revenue += Number(b.price || 0);
    }
    if (b.status === 'cancelled') stats.cancelledBookings++;
    if (b.status === 'declined') stats.declinedBookings++;
    if (b.dateISO === today || b.appointment_date === today) stats.todayBookings++;
  }
  return stats;
}