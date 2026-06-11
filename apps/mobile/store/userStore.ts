import { create } from 'zustand';
import type { UserPreferences, SubscriptionTier } from '@fodmapzen/shared';

interface UserState {
  hasCompletedOnboarding: boolean;
  preferences: UserPreferences | null;
  subscriptionTier: SubscriptionTier;
  supabaseUserId: string | null;
  userEmail: string | null;

  setOnboardingComplete: (prefs: UserPreferences) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setSupabaseUserId: (id: string | null) => void;
  setAuth: (id: string | null, email: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  hasCompletedOnboarding: false,
  preferences: null,
  subscriptionTier: 'free',
  supabaseUserId: null,
  userEmail: null,

  setOnboardingComplete: (prefs) =>
    set({ hasCompletedOnboarding: true, preferences: prefs }),

  updatePreferences: (partial) =>
    set((state) => ({
      preferences: state.preferences
        ? { ...state.preferences, ...partial }
        : null,
    })),

  setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
  setSupabaseUserId: (id) => set({ supabaseUserId: id }),
  setAuth: (id, email) => set({ supabaseUserId: id, userEmail: email }),
}));
