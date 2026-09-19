import { WorkingHours } from '@/types';

/*
 * TEMPORARY MOCK WORKING HOURS
 * Realistic weekly schedule for a demo barber shop.
 */
export const mockWorkingHoursData: WorkingHours = {
  sun: { open: false, start: '10:00', end: '18:00' },
  mon: { open: true, start: '09:30', end: '21:00' },
  tue: { open: true, start: '09:30', end: '21:00' },
  wed: { open: true, start: '09:30', end: '21:00' },
  thu: { open: true, start: '09:30', end: '21:00' },
  fri: { open: true, start: '09:30', end: '21:00' },
  sat: { open: true, start: '08:30', end: '22:00' },
};