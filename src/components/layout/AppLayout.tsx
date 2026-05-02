import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Palette,
  PanelLeftClose,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { navigationItems } from '../../app/navigation/navigation.config'
import { usePermissionHelpers } from '../../features/access/permissions'
import { logoutWithApi } from '../../features/auth/auth.api'
import { useAuthStore } from '../../features/auth/auth.store'
import { useThemeStore, type DashboardTheme } from '../../features/theme/theme.store'

const themeIconMap: Record<DashboardTheme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  classic: Palette,
}

export const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const activeTheme = useThemeStore((state) => state.theme)
  const themeOptions = useThemeStore((state) => state.options)
  const setTheme = useThemeStore((state) => state.setTheme)
  const permissions = usePermissionHelpers()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const visibleNavItems = useMemo(
    () =>
      navigationItems.filter(
        (item) =>
          permissions.canAccessScreen(item.screenCode, item.to) ||
          permissions.canView(item.permissionCodeBase),
      ),
    [permissions],
  )

  const groupedNavItems = useMemo(() => {
    const groups = new Map<string, typeof visibleNavItems>()

    visibleNavItems.forEach((item) => {
      const groupItems = groups.get(item.group) ?? []
      groupItems.push(item)
      groups.set(item.group, groupItems)
    })

    return [...groups.entries()]
  }, [visibleNavItems])

  const currentItem =
    visibleNavItems.find((item) => item.to === location.pathname) ??
    visibleNavItems.find((item) => location.pathname.startsWith(item.to) && item.to !== '/') ??
    visibleNavItems[0]

  const handleLogout = async () => {
    try {
      await logoutWithApi()
    } catch {
      // Logout should still clear local auth even if the session was already revoked.
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.name || user?.username || 'User'
  const initials = displayName.slice(0, 1).toUpperCase()
  const ActiveThemeIcon = themeIconMap[activeTheme]

  const renderSidebarContent = () => (
    <>
      <div className="sidebar-brand-block">
        <div>
          <p className="sidebar-brand">Jiffit</p>
          <p className="sidebar-subtitle">Admin Control Center</p>
        </div>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setIsSidebarCollapsed((state) => !state)}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {groupedNavItems.map(([group, items]) => (
          <div className="sidebar-nav-group" key={group}>
            <p>{group}</p>
            {items.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    setThemeMenuOpen(false)
                    setProfileMenuOpen(false)
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-copy">
            <p>{displayName}</p>
            <span>{user?.role || 'Dashboard user'}</span>
          </div>
        </div>

        <div className="sidebar-premium-pill">
          <ShieldCheck size={14} />
          <span>RBAC protected workspace</span>
        </div>
      </div>
    </>
  )

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {isMobileSidebarOpen ? (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <button
          type="button"
          className="mobile-sidebar-close"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        {renderSidebarContent()}
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <button
            type="button"
            className="sidebar-toggle-btn mobile-only"
            aria-label="Open sidebar"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div className="topbar-title-block">
            <div className="breadcrumbs">
              <span>Dashboard</span>
              <span>/</span>
              <strong>{currentItem?.label ?? 'Workspace'}</strong>
            </div>
            <h1>{currentItem?.label ?? 'Dashboard'}</h1>
            <p className="topbar-subtitle">
              {greeting}, {displayName}. Your menu is built from assigned screens and permissions.
            </p>
          </div>

          <div className="topbar-actions">
            <label className="topbar-search">
              <Search size={15} />
              <input type="text" placeholder="Search dashboard..." />
            </label>

            <button type="button" className="icon-btn notification-btn" aria-label="Notifications">
              <Bell size={16} />
              <span />
            </button>

            <div className="dropdown-wrap">
              <button
                type="button"
                className="icon-btn"
                aria-label="Theme settings"
                onClick={() => setThemeMenuOpen((state) => !state)}
              >
                <ActiveThemeIcon size={16} />
              </button>

              {themeMenuOpen ? (
                <div className="theme-menu">
                  <p className="theme-title">
                    <Palette size={13} /> Select theme
                  </p>
                  {themeOptions.map((option) => {
                    const ThemeIcon = themeIconMap[option.value]

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`theme-option ${activeTheme === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setTheme(option.value)
                          setThemeMenuOpen(false)
                        }}
                      >
                        <ThemeIcon size={14} />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="dropdown-wrap">
              <button
                type="button"
                className="topbar-user-chip"
                onClick={() => setProfileMenuOpen((state) => !state)}
              >
                <span>{initials}</span>
                <div>
                  <p>{displayName}</p>
                  <small>{user?.role || 'admin'}</small>
                </div>
                <ChevronDown size={14} />
              </button>

              {profileMenuOpen ? (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <span>
                      <UserRound size={17} />
                    </span>
                    <div>
                      <strong>{displayName}</strong>
                      <p>{user?.email || user?.username}</p>
                    </div>
                  </div>
                  <div className="profile-menu-meta">
                    <span>{user?.roleCode || 'ROLE'}</span>
                    <span>{user?.userTypeCode || 'TYPE'}</span>
                  </div>
                  <button type="button" className="profile-menu-logout" onClick={handleLogout}>
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="main-content page-transition">
          <Outlet />
        </main>
      </div>

      <div className="ambient-orb one" />
      <div className="ambient-orb two" />
      <div className="ambient-orb three" />
      <Sparkles className="ambient-spark" size={18} />
    </div>
  )
}
