import { Navigate, Route, Routes } from 'react-router-dom'

import { NewsPage } from './pages/NewsPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SessionListPage } from './pages/SessionListPage'
import { SignInPage } from './pages/SignInPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <SessionListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions/:sessionId"
        element={
          <ProtectedRoute>
            <SessionDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news"
        element={
          <ProtectedRoute>
            <NewsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/sessions" replace />} />
    </Routes>
  )
}
