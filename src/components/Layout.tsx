import { Link, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

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
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-4 text-sm">
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
            {user && <span>{user.email}</span>}
            <button onClick={onSignOut} className="rounded border px-2 py-1 hover:bg-gray-100">
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
