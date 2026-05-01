import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type DashboardTheme =
  | 'default'
  | 'dark'
  | 'midnight'
  | 'jiffit-classic-dark'
  | 'jiffit-classic-light'
  | 'jiffit-classic-midnight'

interface ThemeOption {
  value: DashboardTheme
  label: string
}

interface ThemeState {
  theme: DashboardTheme
  setTheme: (theme: DashboardTheme) => void
  options: ThemeOption[]
}

type LegacyTheme =
  | DashboardTheme
  | 'light'
  | null
  | undefined

const normalizeTheme = (value: LegacyTheme): DashboardTheme => {
  if (value === 'default') {
    return 'default'
  }

  if (value === 'dark') {
    return 'dark'
  }

  if (value === 'midnight') {
    return 'midnight'
  }

  if (value === 'jiffit-classic-dark') {
    return 'jiffit-classic-dark'
  }

  if (value === 'jiffit-classic-light') {
    return 'jiffit-classic-light'
  }

  if (value === 'jiffit-classic-midnight') {
    return 'jiffit-classic-midnight'
  }

  if (value === 'light') {
    return 'default'
  }

  return 'dark'
}

const themeOptions: ThemeOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'dark', label: 'Dark' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'jiffit-classic-light', label: 'Jiffit-Classic-light' },
  { value: 'jiffit-classic-dark', label: 'Jiffit-Classic-Dark' },
  { value: 'jiffit-classic-midnight', label: 'Jiffit-Classic-Midnight' },
]

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      options: themeOptions,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'jiffit-dashboard-theme',
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as { theme?: LegacyTheme } | undefined

        return {
          theme: normalizeTheme(state?.theme),
        }
      },
      partialize: (state) => ({
        theme: state.theme,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
