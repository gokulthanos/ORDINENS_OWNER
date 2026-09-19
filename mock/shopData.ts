import { Shop } from '@/types';
import { mockWorkingHoursData } from './workingHoursData';
import { mockBreakData } from './breakData';

/*
 * TEMPORARY MOCK SHOP DATA
 * A realistic sample shop used to demo the Owner Panel locally.
 *
 * NOTE: This shop is NOT automatically attached to a new owner.
 * A new owner's initial state is shop = null so the dashboard
 * correctly shows the "No Shop Yet" state.
 */
export const mockShopData: Shop = {
  id: 'mock-shop-001',
  owner_id: 'mock-owner-001',
  ownerName: 'Gokul',
  ownerPhone: '9876543210',
  name: "Gokul Men's Studio",
  shopType: 'barber',
  shop_type: 'barber',
  phone: '9876543210',
  address: '1000 Feet Road, RS Puram, Coimbatore',
  description: "Professional men's grooming and styling studio.",
  location: 'RS Puram, Coimbatore',
  area: 'RS Puram',
  status: 'active',
  is_live: true,
  capacity: 2,
  booking_window: 30,
  cancellation_hours: 2,
  number_of_barbers: 3,
  slot_interval: 30,
  workingHours: mockWorkingHoursData,
  breaks: mockBreakData,
  imageUrl: null,
  image_url: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
};