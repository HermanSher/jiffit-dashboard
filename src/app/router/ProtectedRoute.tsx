import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isCustomerUser } from '../../features/access/permissions'
import { bootstrapDashboardAccess } from '../../features/auth/auth.api'
import { useAuthStore } from '../../features/auth/auth.store'

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessData = useAuthStore((state) => state.setAccessData)
  const logout = useAuthStore((state) => state.logout)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true

    const bootstrap = async () => {
      setIsBootstrapping(true)

      try {
        const { user: profile, screens, permissions } = await bootstrapDashboardAccess(currentUser ?? undefined)

        if (!isMounted) {
          return
        }

        if (isCustomerUser(profile)) {
          logout()
          setBlockedMessage('Customer accounts cannot access the Jiffit dashboard.')
          return
        }

        setUser(profile)
        setAccessData(screens, permissions)
      } catch (error) {
        if (!isMounted) {
          return
        }

        logout()
        setBlockedMessage(error instanceof Error ? error.message : 'Please login again.')
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [currentUser, isAuthenticated, logout, setAccessData, setUser])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname, message: blockedMessage }} />
  }

  if (isBootstrapping) {
    return (
      <main className="route-loading-shell">
        <div className="route-loading-card">
          <LoaderCircle className="spin" size={22} />
          <h1>Securing your workspace</h1>
          <p>Checking your dashboard session, screens, and permissions.</p>
        </div>
      </main>
    )
  }

  if (blockedMessage) {
    return (
      <main className="route-loading-shell">
        <div className="route-loading-card">
          <ShieldAlert size={24} />
          <h1>Access blocked</h1>
          <p>{blockedMessage}</p>
        </div>
      </main>
    )
  }

  return <Outlet />
}
