import {
  ArrowUpRight,
  CalendarCheck,
  CheckCheck,
  ClipboardList,
  CreditCard,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { navigationItems } from '../../../app/navigation/navigation.config'
import { GlassCard } from '../../../components/ui/GlassCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePermissionHelpers } from '../../access/permissions'
import { useAuthStore } from '../../auth/auth.store'

const activityRows = [
  { id: 'JB-101', user: 'Amit Sharma', action: 'AC deep cleaning booked', status: 'ASSIGNED' },
  { id: 'JB-102', user: 'Neha Patel', action: 'Bathroom cleaning completed', status: 'COMPLETED' },
  { id: 'JB-103', user: 'Ravi Kumar', action: 'Kitchen service payment pending', status: 'PENDING' },
  { id: 'JB-104', user: 'Priya Singh', action: 'Sofa cleaning task closed', status: 'COMPLETED' },
]

const momentumData = [48, 62, 54, 76, 68, 84, 72]

export const DashboardPage = () => {
  const permissions = usePermissionHelpers()
  const screens = useAuthStore((state) => state.screens)
  const effectivePermissions = useAuthStore((state) => state.permissions)

  const quickLinks = navigationItems
    .filter((item) => item.to !== '/dashboard')
    .filter((item) => permissions.canAccessScreen(item.screenCode, item.to))
    .slice(0, 6)

  return (
    <section className="dashboard-page">
      <PageHeader
        eyebrow="Operations cockpit"
        title="Jiffit Dashboard"
        description="A secure, permission-aware command center for bookings, workers, services, assignments, and payments."
        icon={Sparkles}
        actions={
          permissions.canView('BOOKINGS') ? (
            <Link to="/bookings" className="primary-btn">
              Review bookings
              <ArrowUpRight size={15} />
            </Link>
          ) : null
        }
      />

      <div className="dashboard-grid">
        <StatCard label="Booking control" value="RBAC" note="BOOKINGS_* permissions" icon={CalendarCheck} />
        <StatCard label="Dashboard screens" value={screens.length} note="from /api/me/screens" icon={ShieldCheck} tone="blue" />
        <StatCard label="Permissions" value={effectivePermissions.length} note="role + user overrides" icon={CheckCheck} tone="green" />
        <StatCard label="Live tracking" value="Ready" note="/api/dashboard/heroes/live" icon={RadioTower} tone="orange" />
      </div>

      <div className="dashboard-main-grid">
        <GlassCard className="dashboard-hero">
          <span className="dashboard-hero-orb" />
          <div className="dashboard-hero-content">
            <p className="dashboard-kicker">
              <ShieldCheck size={14} />
              Secure by default
            </p>
            <h2>Every dashboard request now travels with JWT auth and permission checks.</h2>
            <p>
              Menus and actions are derived from assigned screens and effective permissions. Customer
              accounts are blocked before they can enter this workspace.
            </p>
            <div className="dashboard-hero-actions">
              {permissions.canView('USERS') ? (
                <Link to="/users" className="secondary-btn">
                  <Users size={15} />
                  Manage users
                </Link>
              ) : null}
              {permissions.canView('PAYMENTS') ? (
                <Link to="/payments" className="secondary-btn">
                  <CreditCard size={15} />
                  View payments
                </Link>
              ) : null}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="dashboard-side-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">Today</p>
              <h2>Service Momentum</h2>
            </div>
            <span className="dashboard-chip">Demo signal</span>
          </div>
          <div className="dashboard-bars">
            {momentumData.map((point, index) => (
              <span key={`${point}-${index}`} style={{ height: `${point}%` }} />
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="dashboard-main-grid">
        <GlassCard className="dashboard-activity-panel">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">
                <ClipboardList size={14} />
                Latest activity
              </p>
              <h2>Recent Booking Activity</h2>
            </div>
            <span className="dashboard-chip">Placeholder data</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.user}</td>
                    <td>{row.action}</td>
                    <td>
                      <StatusBadge value={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="quick-links-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">Allowed screens</p>
              <h2>Quick Launch</h2>
            </div>
            <span className="dashboard-chip">{quickLinks.length} links</span>
          </div>
          <div className="quick-link-grid">
            {quickLinks.map((item) => {
              const Icon = item.icon

              return (
                <Link key={`${item.to}-${item.label}`} to={item.to} className="quick-link-card">
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
