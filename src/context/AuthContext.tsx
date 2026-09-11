import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authApi, type UserDetail } from '../api/auth'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import { tokenStorage } from '../api/tokenStorage'

interface AuthContextValue {
  user: UserDetail | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    // access token 만료 + refresh 실패(client.ts)를 여기서 받아 로그인 화면으로 돌려보낸다.
    // 이미 폐기된 refresh token 이므로 BE 로그아웃 호출은 의미 없다 — 로컬 상태만 정리.
    const onSessionExpired = () => {
      tokenStorage.clear()
      setUser(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn: async (email, password) => {
        const jwt = await authApi.signIn({ email, password })
        tokenStorage.setTokens(jwt.accessToken, jwt.refreshToken)
        setUser(await authApi.me())
      },
      signOut: async () => {
        try {
          await authApi.logout()
        } finally {
          tokenStorage.clear()
          setUser(null)
        }
      },
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
