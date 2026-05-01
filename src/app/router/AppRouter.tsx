import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { BookingsPage } from '../../features/bookings/pages/BookingsPage'
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage'
import { EmployeesPage } from '../../features/employees/pages/EmployeesPage'
import { MastersPage } from '../../features/masters/pages/MastersPage'
import { ProtectedRoute } from './ProtectedRoute'

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/masters" element={<MastersPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
