export type Role = 'customer' | 'owner' | 'admin' | 'barber';

export type ShopStatus = 'pending' | 'active' | 'inactive' | 'suspended';
export type ShopType = 'barber' | 'salon' | 'barber-salon';

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface DayConfig {
  open: boolean;
  start: string;
  end: string;
}

export type WorkingHours = Record<DayKey, DayConfig>;

export interface ShopBreak {
  id: string;
  label: string;
  start: string;
  end: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined' | 'no-show';

export type BookingPeriod = 'morning' | 'afternoon' | 'evening';

export interface OwnerSession {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'owner';
  authenticated: boolean;
  shopId?: string | null;
}

export interface OwnerRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role: 'owner';
  shopId: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  profile_photo?: string | null;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface ShopWorkingHoursRow {
  id: string;
  shop_id: string;
  day_of_week: DayKey;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface ShopBreakRow {
  id: string;
  shop_id: string;
  label: string;
  start_time: string;
  end_time: string;
}

export interface ShopHoliday {
  id?: string;
  shop_id?: string;
  holiday_date: string;
  name: string;
  reason: string;
  created_at?: string;
}

export interface Shop {
  id: string;
  owner_id: string | null;
  ownerName: string;
  ownerPhone: string;
  name: string;
  shopType: ShopType;
  shop_type?: string;
  phone: string;
  address: string;
  description: string;
  location: string;
  area: string;
  status: ShopStatus;
  is_live: boolean;
  capacity: number;
  booking_window: number;
  cancellation_hours: number;
  number_of_barbers: number;
  slot_interval: number;
  workingHours: WorkingHours;
  breaks: ShopBreak[];
  imageUrl?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  shopId?: string;
  shop_id?: string;
  name: string;
  emoji?: string | null;
  icon?: string | null;
  duration_minutes: number;
  duration?: number;
  price: number;
  description?: string | null;
  is_active: boolean;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export type StaffStatus = 'active' | 'inactive';

export interface StaffMember {
  id: string;
  shop_id?: string;
  shopId?: string | null;
  name: string;
  role: string;
  specialty: string;
  years_of_experience: number;
  status: StaffStatus;
  color?: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  customer_id?: string | null;
  shop_id?: string | null;
  service_id?: string | null;
  staff_id?: string | null;
  barber_id?: string | null;
  booking_ref?: string | null;
  appointment_date?: string | null;
  preferred_period?: BookingPeriod | null;
  preferred_time_note?: string | null;
  allocated_start_time?: number | null;
  allocated_end_time?: number | null;
  allocated_by?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_identifier?: string | null;
  customer_note?: string | null;
  status: BookingStatus;
  requested_at?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  advance_paid?: boolean;
  payment_status?: string | null;
  service_name?: string;
  service_price?: number;
  service_duration?: number;
  shop_name?: string;
  barber_name?: string;
  // Local aliases used by the existing business logic
  shopId?: string;
  serviceId?: string;
  dateISO?: string;
  period?: BookingPeriod;
  timeNote?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerIdentifier?: string | null;
  note?: string | null;
  bookingRef?: string;
  customerId?: string | null;
  startMinute?: number | null;
  duration?: number;
  price?: number;
  serviceName?: string;
  shopName?: string;
  staffId?: string;
}

export interface BookingRules {
  booking_window: number;
  cancellation_hours: number;
  capacity: number;
  slot_interval: number;
}

export interface DashboardStats {
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  declinedBookings: number;
  revenue: number;
}

export interface BookingSlot {
  startMinute: number;
  label: string;
}

export type AvailabilityState = 'available' | 'limited' | 'full';