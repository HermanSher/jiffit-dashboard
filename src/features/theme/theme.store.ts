import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type DashboardTheme = 'light' | 'dark' | 'classic'

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
  | 'default'
  | 'midnight'
  | 'jiffit-classic-dark'
  | 'jiffit-classic-light'
  | 'jiffit-classic-midnight'
  | null
  | undefined

const normalizeTheme = (value: LegacyTheme): DashboardTheme => {
  if (value === 'light' || value === 'default' || value === 'jiffit-classic-light') {
    return 'light'
  }

  if (value === 'classic' || value === 'jiffit-classic-dark' || value === 'jiffit-classic-midnight') {
    return 'classic'
  }

  return 'dark'
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'classic', label: 'Classic' },
]

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      options: themeOptions,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'jiffit-dashboard-theme',
      version: 4,
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
