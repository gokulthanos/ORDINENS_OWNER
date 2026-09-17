import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { BookingRules, Service, Shop, StaffMember } from '@/types';
import { useAuth } from './auth';
import { updateOwnerShopId } from '@/services/authService';
import { getMyShop, createShop, updateShop, uploadShopImage, resetLocalShop } from '@/services/shopService';
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  OnboardingDraft,
  saveOnboardingDraft,
} from '@/services/ownerService';

interface OwnerContextValue {
  shop: Shop | null;
  shopLoading: boolean;
  refreshShop: () => Promise<void>;
  createNewShop: (input: Partial<Shop>) => Promise<Shop>;
  updateShopDetails: (patch: Partial<Shop>) => Promise<Shop | null>;
  setShopImage: (uri: string) => Promise<string | null>;
  // Onboarding draft (never lost between steps)
  draft: OnboardingDraft | null;
  drafting: boolean;
  loadDraft: () => Promise<void>;
  updateDraftShop: (patch: Partial<Shop>) => Promise<void>;
  setDraftServices: (services: Partial<Service>[]) => Promise<void>;
  setDraftStaff: (staff: Partial<StaffMember>[]) => Promise<void>;
  setDraftRules: (rules: BookingRules) => Promise<void>;
  markStepComplete: (step: string) => Promise<void>;
  resetDraft: () => Promise<void>;
  bookingsVersion: number;
  bumpBookings: () => void;
}

const EMPTY_RULES: BookingRules = {
  booking_window: 30,
  cancellation_hours: 2,
  capacity: 1,
  slot_interval: 30,
};

const OwnerContext = createContext<OwnerContextValue>({
  shop: null,
  shopLoading: true,
  refreshShop: async () => undefined,
  createNewShop: async () => {
    throw new Error('Not ready');
  },
  updateShopDetails: async () => null,
  setShopImage: async () => null,
  draft: null,
  drafting: true,
  loadDraft: async () => undefined,
  updateDraftShop: async () => undefined,
  setDraftServices: async () => undefined,
  setDraftStaff: async () => undefined,
  setDraftRules: async () => undefined,
  markStepComplete: async () => undefined,
  resetDraft: async () => undefined,
  bookingsVersion: 0,
  bumpBookings: () => undefined,
});

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [drafting, setDrafting] = useState(true);
  const [bookingsVersion, setBookingsVersion] = useState(0);

  const persistDraft = useCallback(
    async (next: OnboardingDraft) => {
      setDraft(next);
      await saveOnboardingDraft(next, session?.id);
    },
    [session?.id]
  );

  const refreshShop = useCallback(async () => {
    if (!session) {
      setShopLoading(false);
      return;
    }
    setShopLoading(true);
    const s = await getMyShop(session.id);
    setShop(s);
    setShopLoading(false);
  }, [session]);

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);

  const loadDraft = useCallback(async () => {
    setDrafting(true);
    const d = await loadOnboardingDraft(session?.id);
    setDraft(d);
    setDrafting(false);
  }, [session?.id]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const createNewShop = useCallback(
    async (input: Partial<Shop>) => {
      if (!session) throw new Error('Not signed in');
      const created = await createShop(session.id, input);
      await updateOwnerShopId(session.id, created.id);
      setShop(created);
      return created;
    },
    [session]
  );

  const updateShopDetails = useCallback(
    async (patch: Partial<Shop>) => {
      if (!shop) return null;
      const updated = await updateShop(shop.id, patch);
      setShop(updated);
      return updated;
    },
    [shop]
  );

  const setShopImage = useCallback(
    async (uri: string) => {
      if (!shop) return null;
      const finalUri = await uploadShopImage(uri, shop.id);
      const updated = await updateShop(shop.id, { imageUrl: finalUri } as Partial<Shop>);
      setShop(updated);
      return updated?.imageUrl ?? null;
    },
    [shop]
  );

  const updateDraftShop = useCallback(
    async (patch: Partial<Shop>) => {
      const base: OnboardingDraft = draft ?? {
        shop: {},
        services: [],
        staff: [],
        bookingRules: { ...EMPTY_RULES },
        completedSteps: [],
      };
      await persistDraft({ ...base, shop: { ...base.shop, ...patch } });
    },
    [draft, persistDraft]
  );

  const setDraftServices = useCallback(
    async (services: Partial<Service>[]) => {
      const base: OnboardingDraft = draft ?? {
        shop: {},
        services: [],
        staff: [],
        bookingRules: { ...EMPTY_RULES },
        completedSteps: [],
      };
      await persistDraft({ ...base, services });
    },
    [draft, persistDraft]
  );

  const setDraftStaff = useCallback(
    async (staff: Partial<StaffMember>[]) => {
      const base: OnboardingDraft = draft ?? {
        shop: {},
        services: [],
        staff: [],
        bookingRules: { ...EMPTY_RULES },
        completedSteps: [],
      };
      await persistDraft({ ...base, staff });
    },
    [draft, persistDraft]
  );

  const setDraftRules = useCallback(
    async (rules: BookingRules) => {
      const base: OnboardingDraft = draft ?? {
        shop: {},
        services: [],
        staff: [],
        bookingRules: { ...EMPTY_RULES },
        completedSteps: [],
      };
      await persistDraft({ ...base, bookingRules: rules });
    },
    [draft, persistDraft]
  );

  const markStepComplete = useCallback(
    async (step: string) => {
      const base: OnboardingDraft = draft ?? {
        shop: {},
        services: [],
        staff: [],
        bookingRules: { ...EMPTY_RULES },
        completedSteps: [],
      };
      const completed = base.completedSteps.includes(step) ? base.completedSteps : [...base.completedSteps, step];
      await persistDraft({ ...base, completedSteps: completed });
    },
    [draft, persistDraft]
  );

  const resetDraft = useCallback(async () => {
    setDraft(null);
    await clearOnboardingDraft(session?.id);
    await resetLocalShop(session?.id);
  }, [session?.id]);

  const bumpBookings = useCallback(() => {
    setBookingsVersion((v) => v + 1);
  }, []);

  return (
    <OwnerContext.Provider
      value={{
        shop,
        shopLoading,
        refreshShop,
        createNewShop,
        updateShopDetails,
        setShopImage,
        draft,
        drafting,
        loadDraft,
        updateDraftShop,
        setDraftServices,
        setDraftStaff,
        setDraftRules,
        markStepComplete,
        resetDraft,
        bookingsVersion,
        bumpBookings,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  return useContext(OwnerContext);
}