import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DashboardScreen, EffectivePermission } from '../access/access.types'
import type { AuthUser } from './auth.types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  screens: DashboardScreen[]
  permissions: EffectivePermission[]
  isAuthenticated: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  setAccessData: (screens: DashboardScreen[], permissions: EffectivePermission[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      screens: [],
      permissions: [],
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      setSession: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        }),
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),
      setAccessData: (screens, permissions) =>
        set({
          screens,
          permissions,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          screens: [],
          permissions: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'jiffit-dashboard-auth',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as
          | Partial<AuthState> & {
              token?: string | null
            }
          | undefined

        return {
          accessToken: state?.accessToken ?? state?.token ?? null,
          refreshToken: state?.refreshToken ?? null,
          user: state?.user ?? null,
          screens: state?.screens ?? [],
          permissions: state?.permissions ?? [],
          isAuthenticated: Boolean(state?.accessToken ?? state?.token),
        }
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        screens: state.screens,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
