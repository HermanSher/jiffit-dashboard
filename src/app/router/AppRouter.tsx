import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { PermissionAssignmentsPage } from '../../features/access/pages/PermissionAssignmentsPage'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { BookingsPage } from '../../features/bookings/pages/BookingsPage'
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage'
import { EmployeesPage } from '../../features/employees/pages/EmployeesPage'
import { MastersPage } from '../../features/masters/pages/MastersPage'
import { resourceConfigs } from '../../features/resources/resource.config'
import { ResourcePage } from '../../features/resources/pages/ResourcePage'
import { HeroLiveLocationsPage } from '../../features/tracking/pages/HeroLiveLocationsPage'
import { PermissionRoute } from './PermissionRoute'
import { ProtectedRoute } from './ProtectedRoute'

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PermissionRoute screenCode="DASHBOARD" routePath="/dashboard">
                  <DashboardPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <PermissionRoute screenCode="BOOKINGS" routePath="/bookings">
                  <BookingsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/masters"
              element={
                <PermissionRoute screenCode="SERVICES" routePath="/masters">
                  <MastersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PermissionRoute screenCode="USERS" routePath="/users">
                  <EmployeesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PermissionRoute screenCode="USERS" routePath="/employees">
                  <EmployeesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/hero-live-locations"
              element={
                <PermissionRoute screenCode="DASHBOARD" routePath="/hero-live-locations">
                  <HeroLiveLocationsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <PermissionRoute screenCode="DASHBOARD" routePath="/tracking">
                  <HeroLiveLocationsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/permission-assignments"
              element={
                <PermissionRoute screenCode="PERMISSIONS" routePath="/permission-assignments">
                  <PermissionAssignmentsPage />
                </PermissionRoute>
              }
            />
            {resourceConfigs.map((config) => (
              <Route
                key={config.key}
                path={config.route}
                element={
                  <PermissionRoute screenCode={config.screenCode} routePath={config.route}>
                    <ResourcePage resourceKey={config.key} />
                  </PermissionRoute>
                }
              />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
