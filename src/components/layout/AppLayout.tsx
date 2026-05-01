import { CalendarDays, Database, Gauge, LogOut, Menu, Palette, Search, Settings, Sparkles, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/auth.store'
import { useThemeStore } from '../../features/theme/theme.store'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/masters', label: 'Masters', icon: Database },
  { to: '/employees', label: 'Employees', icon: Users },
]

export const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const activeTheme = useThemeStore((state) => state.theme)
  const themeOptions = useThemeStore((state) => state.options)
  const setTheme = useThemeStore((state) => state.setTheme)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const title =
    location.pathname === '/employees'
      ? 'Employees'
      : location.pathname === '/bookings'
        ? 'Bookings'
        : location.pathname === '/masters'
          ? 'Masters'
          : 'Dashboard'

  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.name || user?.username || 'User'
  const initials = displayName.slice(0, 1).toUpperCase()

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand-block">
          <p className="sidebar-brand">jiffit</p>
          <p className="sidebar-subtitle">Admin Console</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-copy">
              <p>{displayName}</p>
              <span>{user?.email || 'admin@jiffit.com'}</span>
            </div>
          </div>

          <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          <div className="sidebar-premium-pill">
            <Sparkles size={14} />
            <span>Premium dashboard mode</span>
          </div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <button
            type="button"
            className="sidebar-toggle-btn"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setIsSidebarCollapsed((state) => !state)}
          >
            <Menu size={18} />
          </button>

          <div>
            <h1>{title}</h1>
            <p className="topbar-subtitle">
              {greeting}, {displayName}
            </p>
          </div>

          <div className="topbar-actions">
            <label className="topbar-search">
              <Search size={15} />
              <input type="text" placeholder="Search anything..." />
            </label>

            <button
              type="button"
              className="icon-btn"
              aria-label="Theme settings"
              onClick={() => setThemeMenuOpen((state) => !state)}
            >
              <Settings size={16} />
            </button>

            {themeMenuOpen ? (
              <div className="theme-menu">
                <p className="theme-title">
                  <Palette size={13} /> Select theme
                </p>
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`theme-option ${activeTheme === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(option.value)
                      setThemeMenuOpen(false)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="topbar-user-chip">
              <span>{initials}</span>
              <div>
                <p>{displayName}</p>
                <small>{user?.role || 'admin'}</small>
              </div>
            </div>

            <button type="button" className="logout-btn" onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
