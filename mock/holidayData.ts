import { ShopHoliday, StaffMember, BookingRules } from '@/types';

/*
 * TEMPORARY MOCK HOLIDAY DATA
 * Realistic holiday closures for a demo barber shop.
 */
export const mockHolidayData: ShopHoliday[] = [
  { id: 'mock-hol-001', shop_id: 'mock-shop-001', holiday_date: '2026-10-02', name: 'Gandhi Jayanti', reason: 'National holiday', created_at: '2026-01-10T09:00:00.000Z' },
  { id: 'mock-hol-002', shop_id: 'mock-shop-001', holiday_date: '2026-10-28', name: 'Diwali', reason: 'Festival celebrations', created_at: '2026-01-10T09:00:00.000Z' },
];

/*
 * TEMPORARY MOCK STAFF DATA
 * Number of barbers / capacity sample for a demo barber shop.
 */
export const mockStaffData: StaffMember[] = [
  { id: 'mock-staff-001', shop_id: 'mock-shop-001', shopId: 'mock-shop-001', name: 'Arjun', role: 'Senior Barber', specialty: 'Fades & styling', years_of_experience: 8, status: 'active', color: '#f97316' },
  { id: 'mock-staff-002', shop_id: 'mock-shop-001', shopId: 'mock-shop-001', name: 'Surya', role: 'Barber', specialty: 'Beard grooming', years_of_experience: 5, status: 'active', color: '#fb923c' },
  { id: 'mock-staff-003', shop_id: 'mock-shop-001', shopId: 'mock-shop-001', name: 'Manoj', role: 'Barber', specialty: 'Hair spa & treatments', years_of_experience: 6, status: 'active', color: '#ea580c' },
];

/*
 * TEMPORARY MOCK BOOKING RULES
 * Sample ruleset used by the demo barber shop.
 */
export const mockBookingRulesData: BookingRules = {
  booking_window: 30,
  cancellation_hours: 2,
  capacity: 2,
  slot_interval: 30,
};