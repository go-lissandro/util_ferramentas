import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export interface Tenant {
  id: string;
  name?: string;
  slug: string;
  plan: 'free' | 'pro';
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    user: User;
    tenant: Tenant;
    accessToken: string;
    refreshToken: string;
  }) => void;
  updateTenant: (tenant: Partial<Tenant>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, tenant, accessToken, refreshToken }) =>
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true }),

      updateTenant: (partial) =>
        set((state) => ({
          tenant: state.tenant ? { ...state.tenant, ...partial } : null,
        })),

      logout: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'saas-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
