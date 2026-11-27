import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../lib/auth'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ allow }: { allow?: Role[] }) {
  const { session, role, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (allow && (!role || !allow.includes(role))) return <Navigate to="/" replace />

  return <Outlet />
}