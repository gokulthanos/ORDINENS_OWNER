import { OwnerRecord, Shop, Service, Booking, StaffMember, ShopHoliday, BookingRules, WorkingHours } from '@/types';
import { mockOwnerData } from './ownerData';
import { mockShopData } from './shopData';
import { mockServiceData } from './serviceData';
import { mockBookingData } from './bookingData';
import { mockHolidayData, mockStaffData, mockBookingRulesData } from './holidayData';
import { mockWorkingHoursData } from './workingHoursData';
import { mockBreakData } from './breakData';

/*
 * TEMPORARY MOCK DATA LAYER
 *
 * Realistic, typed sample data used purely for local demos and manual
 * testing of the Owner Panel. It is kept separate from the UI so the
 * service layer can later be swapped for the real backend API.
 *
 * IMPORTANT: This data is NOT automatically written to the app.
 * A new owner always starts with shop = null (and no bookings) so the
 * dashboard correctly shows the "No Shop Yet" state. Seeding a demo
 * owner for testing is done explicitly (e.g. via the owner registry).
 */
export const mockData = {
  owner: mockOwnerData,
  shop: mockShopData,
  services: mockServiceData,
  bookings: mockBookingData,
  holidays: mockHolidayData,
  staff: mockStaffData,
  bookingRules: mockBookingRulesData,
  workingHours: mockWorkingHoursData,
  breaks: mockBreakData,
} satisfies {
  owner: OwnerRecord;
  shop: Shop;
  services: Service[];
  bookings: Booking[];
  holidays: ShopHoliday[];
  staff: StaffMember[];
  bookingRules: BookingRules;
  workingHours: WorkingHours;
  breaks: typeof mockBreakData;
};

export {
  mockOwnerData,
  mockShopData,
  mockServiceData,
  mockBookingData,
  mockHolidayData,
  mockStaffData,
  mockBookingRulesData,
  mockWorkingHoursData,
  mockBreakData,
};
export type { OwnerRecord, Shop, Service, Booking, StaffMember, ShopHoliday, BookingRules, WorkingHours };