import { Service } from '@/types';

/*
 * TEMPORARY MOCK SERVICE DATA
 * Realistic services for a demo barber shop.
 */
export const mockServiceData: Service[] = [
  {
    id: 'mock-svc-001',
    shop_id: 'mock-shop-001',
    shopId: 'mock-shop-001',
    name: 'Classic Haircut',
    emoji: '✂️',
    duration_minutes: 30,
    duration: 30,
    price: 299,
    description: 'Signature scissor and clipper haircut with finish.',
    is_active: true,
    status: 'active',
    created_at: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'mock-svc-002',
    shop_id: 'mock-shop-001',
    shopId: 'mock-shop-001',
    name: 'Beard Trim & Shave',
    emoji: '🧔',
    duration_minutes: 20,
    duration: 20,
    price: 199,
    description: 'Precise beard shaping with a hot towel finish.',
    is_active: true,
    status: 'active',
    created_at: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'mock-svc-003',
    shop_id: 'mock-shop-001',
    shopId: 'mock-shop-001',
    name: 'Hair + Beard Combo',
    emoji: '💈',
    duration_minutes: 45,
    duration: 45,
    price: 449,
    description: 'Full haircut and beard grooming session.',
    is_active: true,
    status: 'active',
    created_at: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'mock-svc-004',
    shop_id: 'mock-shop-001',
    shopId: 'mock-shop-001',
    name: 'Premium Hair Spa',
    emoji: '💆',
    duration_minutes: 60,
    duration: 60,
    price: 599,
    description: 'Relaxing scalp and hair spa treatment.',
    is_active: true,
    status: 'active',
    created_at: '2026-01-10T09:00:00.000Z',
  },
];