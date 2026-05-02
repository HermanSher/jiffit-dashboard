import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isCustomerUser, isSuperUser } from '../../features/access/permissions'
import { bootstrapDashboardAccess } from '../../features/auth/auth.api'
import { useAuthStore } from '../../features/auth/auth.store'

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessData = useAuthStore((state) => state.setAccessData)
  const logout = useAuthStore((state) => state.logout)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')
  const bootstrappedSessionRef = useRef<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      bootstrappedSessionRef.current = null
      return
    }

    const sessionKey = `${accessToken}:${refreshToken ?? 'legacy'}`

    if (bootstrappedSessionRef.current === sessionKey) {
      return
    }

    let isMounted = true

    const bootstrap = async () => {
      const currentUser = useAuthStore.getState().user

      if (currentUser && !refreshToken && isSuperUser(currentUser)) {
        setAccessData([], [])
        bootstrappedSessionRef.current = sessionKey
        return
      }

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
        bootstrappedSessionRef.current = sessionKey
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
  }, [accessToken, isAuthenticated, logout, refreshToken, setAccessData, setUser])

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
