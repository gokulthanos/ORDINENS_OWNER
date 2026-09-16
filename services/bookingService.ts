import { Booking, BookingStatus, DashboardStats, Service, Shop, ShopHoliday } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { isMockMode } from './dataMode';
import { STORAGE_KEYS, readJSON, writeJSON } from '@/utils/storage';
import { todayISO } from '@/utils/format';
import { getService } from './serviceService';
import { isSlotAvailable, generateSlots } from './slotService';

const LOCAL_KEY = STORAGE_KEYS.bookings;

/* ------------------------------ Mappers ------------------------------ */

export function fromBookingRow(row: Record<string, unknown>): Booking {
  const services = (row.services && typeof row.services === 'object' ? row.services : null) as Record<string, unknown> | null;
  const shops = (row.shops && typeof row.shops === 'object' ? row.shops : null) as Record<string, unknown> | null;

  const str = (v: unknown, f = ''): string => (v == null || v === '' ? f : String(v));
  const num = (v: unknown, f = 0): number => {
    const n = Number(v);
    return Number.isNaN(n) ? f : n;
  };

  const startMinutes = row.allocated_start_time == null ? null : num(row.allocated_start_time, 0);
  const serviceName = services ? str(services.name) : str(row.service_name);
  const servicePrice = services ? num(services.price) : num(row.service_price);
  const serviceDuration = services ? num(services.duration_minutes) : num(row.service_duration, 30);
  const shopName = shops ? str(shops.name) : str(row.shop_name);

  return {
    id: str(row.id),
    customer_id: row.customer_id ? str(row.customer_id) : null,
    shop_id: row.shop_id ? str(row.shop_id) : null,
    service_id: row.service_id ? str(row.service_id) : null,
    staff_id: row.barber_id ? str(row.barber_id) : row.staff_id ? str(row.staff_id) : null,
    barber_id: row.barber_id ? str(row.barber_id) : row.staff_id ? str(row.staff_id) : null,
    booking_ref: row.booking_ref ? str(row.booking_ref) : null,
    appointment_date: row.appointment_date ? str(row.appointment_date) : null,
    preferred_period: row.preferred_period ? (row.preferred_period as Booking['preferred_period']) : null,
    preferred_time_note: row.preferred_time_note == null ? null : str(row.preferred_time_note),
    allocated_start_time: startMinutes,
    allocated_end_time: row.allocated_end_time == null ? null : num(row.allocated_end_time, 0),
    allocated_by: row.allocated_by ? str(row.allocated_by) : null,
    customer_name: row.customer_name == null ? null : str(row.customer_name),
    customer_phone: row.customer_phone == null ? null : str(row.customer_phone),
    customer_identifier: row.customer_identifier == null ? null : str(row.customer_identifier),
    customer_note: row.customer_note == null ? null : str(row.customer_note),
    status: (str(row.status, 'pending') as BookingStatus),
    requested_at: row.requested_at ? str(row.requested_at) : null,
    confirmed_at: row.confirmed_at ? str(row.confirmed_at) : null,
    cancelled_at: row.cancelled_at ? str(row.cancelled_at) : null,
    created_at: row.created_at ? str(row.created_at) : undefined,
    updated_at: row.updated_at ? str(row.updated_at) : undefined,
    advance_paid: row.advance_paid === true || row.advance_paid === 1,
    payment_status: row.payment_status == null ? null : str(row.payment_status),
    // local aliases
    shopId: row.shop_id ? str(row.shop_id) : undefined,
    serviceId: row.service_id ? str(row.service_id) : undefined,
    dateISO: row.appointment_date ? str(row.appointment_date) : undefined,
    period: (row.preferred_period as Booking['period']) ?? undefined,
    timeNote: row.preferred_time_note == null ? undefined : str(row.preferred_time_note),
    customerName: row.customer_name == null ? null : str(row.customer_name),
    customerPhone: row.customer_phone == null ? null : str(row.customer_phone),
    customerIdentifier: row.customer_identifier == null ? null : str(row.customer_identifier),
    note: row.customer_note == null ? null : str(row.customer_note),
    bookingRef: row.booking_ref ? str(row.booking_ref) : undefined,
    customerId: row.customer_id ? str(row.customer_id) : null,
    staffId: row.barber_id ? str(row.barber_id) : row.staff_id ? str(row.staff_id) : undefined,
    startMinute: startMinutes,
    duration: serviceDuration,
    price: servicePrice,
    serviceName,
    shopName: shopName || undefined,
    barber_name: str(row.barber_name) || undefined,
  };
}

export function toLocalBooking(booking: Booking): Booking {
  return {
    ...booking,
    shopId: booking.shop_id ?? booking.shopId,
    serviceId: booking.service_id ?? booking.serviceId,
    dateISO: booking.appointment_date ?? booking.dateISO,
    period: booking.preferred_period ?? booking.period,
    timeNote: booking.preferred_time_note ?? booking.timeNote,
    customerName: booking.customer_name ?? booking.customerName,
    customerPhone: booking.customer_phone ?? booking.customerPhone,
    customerIdentifier: booking.customer_identifier ?? booking.customerIdentifier,
    note: booking.customer_note ?? booking.note,
    bookingRef: booking.booking_ref ?? booking.bookingRef,
    customerId: booking.customer_id ?? booking.customerId,
    startMinute: booking.allocated_start_time ?? booking.startMinute,
  };
}

/* ----------------------------- Storage ------------------------------- */

async function getLocalBookings(): Promise<Booking[]> {
  return readJSON<Booking[]>(LOCAL_KEY, []);
}

async function setLocalBookings(list: Booking[]): Promise<Booking[]> {
  await writeJSON(LOCAL_KEY, list);
  return list;
}

/* ------------------------------ Queries ------------------------------ */

export async function getBookings(shopId?: string): Promise<Booking[]> {
  if (isMockMode() || !isSupabaseConfigured) {
    const all = await getLocalBookings();
    return shopId ? all.filter((b) => b.shopId === shopId) : all;
  }
  try {
    const select = `
      id, booking_ref, customer_id, shop_id, service_id, appointment_date,
      preferred_period, preferred_time_note, allocated_start_time, allocated_end_time,
      allocated_by, customer_name, customer_phone, customer_identifier, customer_note,
      status, requested_at, confirmed_at, cancelled_at, created_at, updated_at,
      advance_paid, payment_status,
      services(name, price, duration_minutes),
      shops(name)
    `;
    let query = supabase.from('bookings').select(select).order('appointment_date', { ascending: false }).order('created_at', { ascending: false });
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query;
    if (error) {
      if (!String(error.message).toLowerCase().includes('does not exist')) throw error;
      return [];
    }
    const list = (data ?? []).map((r) => fromBookingRow(r as Record<string, unknown>));
    await setLocalBookings(list);
    return list;
  } catch (err) {
    console.warn('[bookingService] getBookings fallback:', (err as Error).message);
    return getLocalBookings();
  }
}

export async function getBooking(id: string, shopId?: string): Promise<Booking | null> {
  if (isMockMode() || !isSupabaseConfigured) {
    const all = await getLocalBookings();
    return all.find((b) => b.id === id) || null;
  }
  try {
    const select = `
      id, booking_ref, customer_id, shop_id, service_id, appointment_date,
      preferred_period, preferred_time_note, allocated_start_time, allocated_end_time,
      allocated_by, customer_name, customer_phone, customer_identifier, customer_note,
      status, requested_at, confirmed_at, cancelled_at, created_at, updated_at,
      advance_paid, payment_status,
      services(name, price, duration_minutes),
      shops(name)
    `;
    let query = supabase.from('bookings').select(select).eq('id', id);
    if (shopId) query = query.eq('shop_id', shopId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) return fromBookingRow(data as Record<string, unknown>);
  } catch (err) {
    console.warn('[bookingService] getBooking fallback:', (err as Error).message);
  }
  const all = await getLocalBookings();
  return all.find((b) => b.id === id) || null;
}

/**
 * Confirmed bookings for a given date in the shape the slot engine expects.
 * Used for availability checks and slot generation.
 */
export async function getConfirmedBookingsForDate(shopId: string, dateISO: string): Promise<Booking[]> {
  if (isMockMode() || !isSupabaseConfigured) {
    const all = await getLocalBookings();
    return all.filter((b) => b.shopId === shopId && b.dateISO === dateISO && b.status === 'confirmed' && b.startMinute != null);
  }
  try {
    const select = `
      id, shop_id, appointment_date, allocated_start_time, status,
      services(duration_minutes), services(name), services(price)
    `;
    const { data, error } = await supabase
      .from('bookings')
      .select(select)
      .eq('shop_id', shopId)
      .eq('appointment_date', dateISO)
      .eq('status', 'confirmed')
      .not('allocated_start_time', 'is', null);
    if (error) throw error;
    return (data ?? []).map((r) => fromBookingRow(r as Record<string, unknown>));
  } catch (err) {
    console.warn('[bookingService] getConfirmedBookingsForDate fallback:', (err as Error).message);
    const all = await getLocalBookings();
    return all.filter((b) => b.shopId === shopId && b.dateISO === dateISO && b.status === 'confirmed' && b.startMinute != null);
  }
}

/* --------------------------- Status changes -------------------------- */

async function persistLocalStatus(id: string, patch: Partial<Booking>): Promise<Booking | null> {
  const list = await getLocalBookings();
  let updated: Booking | null = null;
  const next = list.map((b) => {
    if (b.id === id) {
      updated = { ...b, ...patch };
      return updated;
    }
    return b;
  });
  await setLocalBookings(next);
  return updated;
}

async function writeStatusHistory(bookingId: string, oldStatus: string | null, newStatus: string, changedBy: string | null, note: string | null): Promise<void> {
  if (isMockMode() || !isSupabaseConfigured) return;
  try {
    await supabase.from('booking_status_history').insert({
      booking_id: bookingId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      note,
      created_at: new Date().toISOString(),
    });
  } catch {
    // best effort
  }
}

export async function updateBookingStatus(id: string, status: BookingStatus, note?: string | null, allocatedBy?: string | null): Promise<Booking | null> {
  const current = await getBooking(id);
  const now = new Date().toISOString();
  const patch: Partial<Booking> = { status, updated_at: now };
  if (status === 'confirmed') {
    patch.allocated_by = allocatedBy ?? current?.allocated_by ?? null;
  }
  if (status === 'cancelled' || status === 'declined') patch.cancelled_at = now;

  if (isMockMode() || !isSupabaseConfigured) {
    const updated = await persistLocalStatus(id, patch);
    if (updated) {
      await writeStatusHistory(id, current?.status ?? null, status, allocatedBy ?? null, note ?? null);
    }
    return updated;
  }
  try {
    const dbPatch: Record<string, unknown> = { status, updated_at: now };
    if (status === 'confirmed') {
      dbPatch.confirmed_at = now;
      dbPatch.allocated_by = allocatedBy ?? current?.allocated_by ?? null;
    }
    if (status === 'cancelled' || status === 'declined') dbPatch.cancelled_at = now;
    const { error } = await supabase.from('bookings').update(dbPatch).eq('id', id);
    if (error) throw error;
    await writeStatusHistory(id, current?.status ?? null, status, allocatedBy ?? null, note ?? null);
    const refreshed = await getBooking(id);
    if (refreshed) {
      await persistLocalStatus(id, refreshed);
      return refreshed;
    }
  } catch (err) {
    console.warn('[bookingService] updateBookingStatus fallback:', (err as Error).message);
  }
  const updated = await persistLocalStatus(id, patch);
  if (updated) await writeStatusHistory(id, current?.status ?? null, status, allocatedBy ?? null, note ?? null);
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

  if (isMockMode() || !isSupabaseConfigured) {
    const updated = await persistLocalStatus(latest.id, patch);
    if (updated) await writeStatusHistory(latest.id, 'pending', 'confirmed', patch.allocated_by ?? null, 'Confirmed by owner');
    return { ok: true, booking: updated ?? undefined };
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: now,
        allocated_start_time: startMinute,
        allocated_end_time: endMinute,
        allocated_by: patch.allocated_by,
        updated_at: now,
      })
      .eq('id', latest.id);
    if (error) throw error;
    await writeStatusHistory(latest.id, 'pending', 'confirmed', patch.allocated_by ?? null, 'Confirmed by owner');
    const refreshed = await getBooking(latest.id);
    if (refreshed) await persistLocalStatus(latest.id, refreshed);
    return { ok: true, booking: refreshed ?? undefined };
  } catch (err) {
    console.warn('[bookingService] confirmBooking:', (err as Error).message);
    return { ok: false, error: 'Unable to confirm the booking. Please try again.' };
  }
}

export async function declineBooking(bookingId: string, allocatedBy?: string | null, reason?: string): Promise<ConfirmResult> {
  const latest = await getBooking(bookingId);
  if (!latest) return { ok: false, error: 'Unable to load the booking. Please try again.' };
  if (latest.status !== 'pending') {
    return { ok: false, error: 'This booking is no longer pending and cannot be declined.' };
  }
  const updated = await updateBookingStatus(bookingId, 'declined', reason ?? null, allocatedBy ?? null);
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