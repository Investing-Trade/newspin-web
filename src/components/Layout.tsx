import { Link, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'

export function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const onSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/sessions" className="font-semibold">
              NewsPin
            </Link>
            <Link to="/sessions" className="text-gray-600 hover:text-gray-900">
              내 세션
            </Link>
            <Link to="/news" className="text-gray-600 hover:text-gray-900">
              뉴스 학습
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {user && <span className="hidden truncate sm:inline">{user.email}</span>}
            <Button variant="secondary" onClick={onSignOut} className="px-2 py-1">
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
