import { useEffect } from 'react'
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
    </QueryProvider>
  )
}

export default App
