import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { CreateSessionPage } from './pages/CreateSessionPage'
import { NewsPage } from './pages/NewsPage'
import { SessionListPage } from './pages/SessionListPage'
import { SessionWorkspacePage } from './pages/SessionWorkspacePage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/sessions" element={<SessionListPage />} />
        <Route path="/sessions/new" element={<CreateSessionPage />} />
        <Route path="/sessions/:sessionId" element={<SessionWorkspacePage />} />
        <Route path="/news" element={<NewsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/sessions" replace />} />
    </Routes>
  )
}
