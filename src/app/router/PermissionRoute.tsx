import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissionHelpers } from '../../features/access/permissions'

interface PermissionRouteProps {
  screenCode: string
  routePath?: string
  children: ReactNode
}

export const PermissionRoute = ({ screenCode, routePath, children }: PermissionRouteProps) => {
  const permissions = usePermissionHelpers()

  if (!permissions.canAccessScreen(screenCode, routePath) && !permissions.canView(screenCode)) {
    return (
      <section className="permission-denied-card">
        <ShieldAlert size={28} />
        <h1>Permission required</h1>
        <p>You do not have access to this dashboard section.</p>
        <Navigate to="/dashboard" replace />
      </section>
    )
  }

  return children
}
