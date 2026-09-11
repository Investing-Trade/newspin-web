import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authApi, type UserDetail } from '../api/auth'
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
