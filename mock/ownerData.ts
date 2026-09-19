import { OwnerRecord } from '@/types';

/*
 * TEMPORARY MOCK OWNER DATA
 * Sample owner record used to demo the Owner Panel locally.
 * Not auto-created: a new owner always starts with a fresh (empty) state.
 */
export const mockOwnerData: OwnerRecord = {
  id: 'mock-owner-001',
  email: 'gokul@gmail.com',
  password: 'Gokul@123',
  name: 'Gokul',
  phone: '9876543210',
  role: 'owner',
  shopId: 'mock-shop-001',
  createdAt: '2026-01-10T09:00:00.000Z',
};

export const mockOwnerNameFromEmail = (email: string): string =>
  email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
    .charAt(0)
    .toUpperCase() + email.split('@')[0].replace(/[._-]+/g, ' ').trim().slice(1);