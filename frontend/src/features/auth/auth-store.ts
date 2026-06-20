'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AuthTokens } from './auth-types';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  // Tracks when persist middleware has finished reading from localStorage.
  // Always false on first render (SSR/hydration), set to true by onRehydrateStorage.
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  clearAuth: () => void;
  _setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'deligo-auth',
      // Only persist auth data — _hasHydrated and _setHasHydrated are transient.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // Called after localStorage has been read and state is restored.
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);

export const selectIsAuthenticated = (s: AuthState) =>
  s.user !== null && s.accessToken !== null;

export const selectIsProvider = (s: AuthState) =>
  s.user?.roles.includes('provider') ?? false;

export const selectIsAdmin = (s: AuthState) =>
  s.user?.roles.includes('admin') ?? false;
