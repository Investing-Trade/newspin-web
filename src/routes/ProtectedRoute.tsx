import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <p className="p-6 text-sm text-gray-500">불러오는 중…</p>
  if (!user) return <Navigate to="/sign-in" replace />
  return <>{children}</>
}
