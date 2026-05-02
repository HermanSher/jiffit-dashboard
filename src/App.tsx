import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { QueryProvider } from './app/providers/QueryProvider'
import { AppRouter } from './app/router/AppRouter'
import { useThemeStore } from './features/theme/theme.store'
import './App.css'

function App() {
  const activeTheme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
  }, [activeTheme])

  return (
    <QueryProvider>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  )
}

export default App
