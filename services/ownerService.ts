import { BookingRules, Service, Shop, ShopHoliday, StaffMember } from '@/types';
import { getMyShop, setShopStatus, updateShop, EMPTY_WORKING_HOURS } from './shopService';
import { getServices } from './serviceService';
import { getStaff } from './staffService';
import { getHolidays } from './holidayService';
import { getBookings, getDashboardStats } from './bookingService';
import { STORAGE_KEYS, ownerScopedKey, readJSON, writeJSON, removeItem } from '@/utils/storage';

/* -------------------------- Onboarding draft ------------------------- */

export interface OnboardingDraft {
  shop: Partial<Shop>;
  services: Partial<Service>[];
  staff: Partial<StaffMember>[];
  bookingRules: BookingRules;
  completedSteps: string[];
}

function draftKey(ownerId?: string | null): string {
  return ownerId ? ownerScopedKey(STORAGE_KEYS.onboarding, ownerId) : STORAGE_KEYS.onboarding;
}

export async function loadOnboardingDraft(ownerId?: string | null): Promise<OnboardingDraft | null> {
  return readJSON<OnboardingDraft | null>(draftKey(ownerId), null);
}

export async function saveOnboardingDraft(draft: OnboardingDraft, ownerId?: string | null): Promise<void> {
  await writeJSON(draftKey(ownerId), draft);
}

export async function clearOnboardingDraft(ownerId?: string | null): Promise<void> {
  await removeItem(draftKey(ownerId));
}

/* ----------------------------- Validation ---------------------------- */

export interface OnboardingValidation {
  valid: boolean;
  errors: string[];
}

export function validateShopDetails(shop: Partial<Shop>): OnboardingValidation {
  const errors: string[] = [];
  if (!shop.name?.trim()) errors.push('Shop name is required.');
  if (!shop.ownerName?.trim()) errors.push('Owner name is required.');
  if (!shop.phone?.trim() && !shop.ownerPhone?.trim()) errors.push('Phone number is required.');
  if (!shop.location?.trim()) errors.push('Location is required.');
  if (!shop.address?.trim()) errors.push('Address is required.');
  const digits = (shop.phone || shop.ownerPhone || '').replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) errors.push('Enter a valid phone number.');
  return { valid: errors.length === 0, errors };
}

export function validateWorkingHours(workingHours: Shop['workingHours']): OnboardingValidation {
  const errors: string[] = [];
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const labels: Record<string, string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
  };
  let hasOpenDay = false;
  for (const key of Object.keys(workingHours)) {
    const day = workingHours[key as keyof typeof workingHours];
    if (!day.open) continue;
    hasOpenDay = true;
    const start = toMin(day.start);
    const end = toMin(day.end);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.push(`${labels[key]}: set valid open and close times.`);
    } else if (end <= start) {
      errors.push(`${labels[key]}: closing time must be after opening time.`);
    }
  }
  if (!hasOpenDay) errors.push('At least one working day must be open.');
  return { valid: errors.length === 0, errors };
}

export function validateBreaks(workingHours: Shop['workingHours'], breaks: Shop['breaks']): OnboardingValidation {
  const errors: string[] = [];
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const dayBounds = Object.values(workingHours).filter((d) => d.open);
  const openDay = dayBounds.length ? dayBounds[0] : null;

  for (let i = 0; i < breaks.length; i++) {
    const br = breaks[i];
    const start = toMin(br.start);
    const end = toMin(br.end);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.push(`Break "${br.label}": set valid start and end times.`);
      continue;
    }
    if (end <= start) {
      errors.push(`Break "${br.label}": end time must be after start time.`);
    }
    if (openDay) {
      const o = toMin(openDay.start);
      const c = toMin(openDay.end);
      if (start < o || end > c) {
        errors.push(`Break "${br.label}" is outside working hours.`);
      }
    }
    for (let j = i + 1; j < breaks.length; j++) {
      const oth = breaks[j];
      const oS = toMin(oth.start);
      const oE = toMin(oth.end);
      if (start < oE && end > oS) {
        errors.push(`Break "${br.label}" overlaps with "${oth.label}".`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateServices(services: Array<Partial<Service>>): OnboardingValidation {
  const errors: string[] = [];
  if (!services.length) {
    errors.push('Add at least one service.');
    return { valid: false, errors };
  }
  services.forEach((s, i) => {
    if (!s.name?.trim()) errors.push(`Service #${i + 1}: name is required.`);
    if (!s.price || Number(s.price) <= 0) errors.push(`Service "${s.name || i + 1}": price must be greater than zero.`);
    if (!s.duration_minutes && !s.duration) errors.push(`Service "${s.name || i + 1}": duration is required.`);
  });
  return { valid: errors.length === 0, errors };
}

export function validateStaff(staff: Array<Partial<StaffMember>>): OnboardingValidation {
  const errors: string[] = [];
  staff.forEach((m, i) => {
    if (!m.name?.trim()) errors.push(`Staff #${i + 1}: full name is required.`);
  });
  return { valid: errors.length === 0, errors };
}

export function validateBookingRules(rules: BookingRules): OnboardingValidation {
  const errors: string[] = [];
  if (!rules.booking_window || Number(rules.booking_window) <= 0) errors.push('Advance booking window must be at least 1 day.');
  if (rules.cancellation_hours < 0) errors.push('Cancellation window cannot be negative.');
  if (!rules.capacity || Number(rules.capacity) <= 0) errors.push('Capacity (seats) must be at least 1.');
  if (!rules.slot_interval || Number(rules.slot_interval) < 15) errors.push('Slot interval must be at least 15 minutes.');
  return { valid: errors.length === 0, errors };
}

/* ------------------------------ Go live ------------------------------ */

export interface GoLiveResult {
  ok: boolean;
  error?: string;
  shop?: Shop;
}

/**
 * Validate mandatory configuration, persist the shop and flip it to live.
 * Does not fake success: only returns ok when the shop was persisted
 * (and marked live) successfully.
 */
export async function goLive(shop: Partial<Shop>, ownerId: string, rules: BookingRules): Promise<GoLiveResult> {
  const checks: Array<{ label: string; check: OnboardingValidation }> = [
    { label: 'Shop details', check: validateShopDetails(shop) },
    { label: 'Working hours', check: validateWorkingHours(shop.workingHours ?? EMPTY_WORKING_HOURS) },
    { label: 'Breaks', check: validateBreaks(shop.workingHours ?? EMPTY_WORKING_HOURS, shop.breaks ?? []) },
    { label: 'Booking rules', check: validateBookingRules(rules) },
  ];
  for (const item of checks) {
    if (!item.check.valid) {
      return { ok: false, error: `${item.label}: ${item.check.errors[0]}` };
    }
  }
  if (!shop.id) return { ok: false, error: 'Shop is not saved yet.' };

  const services = await getServices(shop.id);
  if (!services.length) return { ok: false, error: 'Add at least one service before going live.' };
  const staff = await getStaff(shop.id);
  if (!staff.length) return { ok: false, error: 'Add at least one staff member before going live.' };

  try {
    const patch: Partial<Shop> = {
      booking_window: rules.booking_window,
      cancellation_hours: rules.cancellation_hours,
      capacity: rules.capacity,
      number_of_barbers: Math.max(1, staff.length),
      slot_interval: rules.slot_interval,
      status: 'active',
      is_live: true,
    };
    const saved = await updateShop(shop.id, patch);
    return saved ? { ok: true, shop: saved } : { ok: false, error: 'Unable to save the shop.' };
  } catch (err) {
    console.warn('[ownerService] goLive:', (err as Error).message);
    return { ok: false, error: 'Unable to go live. Please try again.' };
  }
}

export async function setShopLiveStatus(shopId: string, status: 'active' | 'inactive'): Promise<void> {
  await setShopStatus(shopId, status, status === 'active');
}

/* ------------------------------ Dashboard ---------------------------- */

export interface OwnerDashboard {
  shop: Shop | null;
  services: Service[];
  staff: StaffMember[];
  holidays: ShopHoliday[];
  bookingsCount: number;
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
}

export async function loadOwnerDashboard(ownerId: string, shopId?: string): Promise<OwnerDashboard> {
  let shop = await getMyShop(ownerId);
  if (shop && shopId && shop.id !== shopId) {
    const again = await getMyShop(ownerId);
    if (again) shop = again;
  }
  if (!shop) {
    return { shop: null, services: [], staff: [], holidays: [], bookingsCount: 0, todayBookings: 0, pendingBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, revenue: 0 };
  }
  const [services, staff, holidays, bookings, stats] = await Promise.all([
    getServices(shop.id),
    getStaff(shop.id),
    getHolidays(shop.id),
    getBookings(shop.id),
    getDashboardStats(shop.id),
  ]);
  return {
    shop,
    services,
    staff,
    holidays,
    bookingsCount: bookings.length,
    todayBookings: stats.todayBookings,
    pendingBookings: stats.pendingBookings,
    confirmedBookings: stats.confirmedBookings,
    completedBookings: stats.completedBookings,
    cancelledBookings: stats.cancelledBookings,
    revenue: stats.revenue,
  };
}