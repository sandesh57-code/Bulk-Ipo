import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { loadUserFromStorage } from './redux/slices/authSlice'
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import SavedAccounts from './pages/SavedAccounts'
import BulkApplyIPO from './pages/BulkApplyIPO'
import BulkIPOResult from './pages/BulkIPOResult'
import Portfolio from './pages/Portfolio'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import ProfileSettings from './pages/ProfileSettings'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'

export default function App() {
  const dispatch = useDispatch()
  const { theme } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(loadUserFromStorage())
  }, [dispatch])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      {/* Guest Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Authenticated Dashboard Routes */}
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<SavedAccounts />} />
        <Route path="/bulk-apply" element={<BulkApplyIPO />} />
        <Route path="/results" element={<BulkIPOResult />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<ProfileSettings />} />
        
        {/* Admin only route */}
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
