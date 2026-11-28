import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
<<<<<<< HEAD
import LoadingScreen from './components/LoadingScreen'
=======
import { PageSkeleton } from './components/Skeleton'
>>>>>>> origin/main
import Login from './pages/Login'
import Pos from './pages/Pos'
import Transactions from './pages/Transactions'
import Dashboard from './pages/admin/Dashboard'
import MenuManagement from './pages/admin/MenuManagement'
import Inventory from './pages/admin/Inventory'
import Reports from './pages/admin/Reports'
import Users from './pages/admin/Users'

function Home() {
  const { session, role, loading } = useAuth()
<<<<<<< HEAD
  if (loading) return <LoadingScreen />
=======
  if (loading) return <PageSkeleton label="Checking your account…" />
>>>>>>> origin/main
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={role === 'admin' ? '/admin' : '/pos'} replace />
}

function LoginRoute() {
  const { session, loading } = useAuth()
<<<<<<< HEAD
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />
  return <Login />
=======
  const [loginPending, setLoginPending] = useState(false)
  const [loginConfirmed, setLoginConfirmed] = useState(false)

  if (loginConfirmed && session) return <Navigate to="/" replace />
  if (loading && !loginPending) return <PageSkeleton label="Checking your account…" />
  if (session && !loginPending) return <Navigate to="/" replace />

  return (
    <Login
      onRequestStart={() => setLoginPending(true)}
      onRequestFailed={() => setLoginPending(false)}
      onSuccessAnimationComplete={() => {
        setLoginPending(false)
        setLoginConfirmed(true)
      }}
    />
  )
>>>>>>> origin/main
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedRoute allow={['admin', 'cashier']} />}>
            <Route path="/pos" element={<Pos />} />
            <Route path="/transactions" element={<Transactions />} />
          </Route>
          <Route element={<ProtectedRoute allow={['admin']} />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/menu" element={<MenuManagement />} />
            <Route path="/admin/inventory" element={<Inventory />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}