import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
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
  if (loading) return <p className="p-6">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={role === 'admin' ? '/admin' : '/pos'} replace />
}

function LoginRoute() {
  const { session, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  if (session) return <Navigate to="/" replace />
  return <Login />
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