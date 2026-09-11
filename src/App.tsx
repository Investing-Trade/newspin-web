import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { CreateSessionPage } from './pages/CreateSessionPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { GuidePage } from './pages/GuidePage'
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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      {/* 로그인 여부와 무관하게 접근 가능 — 로그인 전 화면과 앱 내 nav 양쪽에서 연결 */}
      <Route path="/guide" element={<GuidePage />} />

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
