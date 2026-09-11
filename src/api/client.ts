import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { tokenStorage } from './tokenStorage'
import type { ApiResponse } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 만료/유효하지 않은 access token 은 JwtAuthenticationFilter 가 필터 단계에서 바로
// 401 을 내려보낸다(GlobalExceptionHandler 를 타지 않아 ApiResponse 바디가 없다) — 상태
// 코드만으로 판단해야 한다. 동시에 여러 요청이 401 을 맞아도 refresh 는 한 번만 나가도록
// 진행 중인 refresh Promise 를 공유한다.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ jwtToken: { accessToken: string; refreshToken: string } }>>(
        `${API_BASE_URL}/user/refresh`,
        { refreshToken },
      )
      .then((res) => {
        const jwt = res.data.data?.jwtToken
        if (!jwt) return null
        tokenStorage.setTokens(jwt.accessToken, jwt.refreshToken)
        return jwt.accessToken
      })
      .catch(() => {
        tokenStorage.clear()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retried && !original.url?.endsWith('/user/refresh')) {
      original._retried = true
      const newAccessToken = await refreshAccessToken()
      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(original)
      }
      // refresh 도 실패 — 재로그인 필요. 라우팅은 컴포넌트 쪽(AuthContext)에서 401 전파로 처리.
    }
    return Promise.reject(error)
  },
)

/** 응답의 `data`(성공 시 항상 존재)만 꺼내는 헬퍼. 실패는 axios 가 그대로 throw. */
export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  if (response.data.data === null) {
    throw new Error(`API 응답에 data 가 없습니다: ${response.data.code} ${response.data.message}`)
  }
  return response.data.data
}
