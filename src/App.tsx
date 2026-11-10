import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Pos from './pages/Pos'
import Admin from './pages/admin/Dashboard'

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
          </Route>
          <Route element={<ProtectedRoute allow={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}