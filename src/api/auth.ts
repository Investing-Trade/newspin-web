import { apiClient, unwrap } from './client'
import type { ApiResponse } from './types'

export interface JwtToken {
  grantType: string
  accessToken: string
  refreshToken: string
}

export interface SignUpRequest {
  email: string
  password: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface UserDetail {
  userId: number
  email: string
}

export const authApi = {
  sendVerificationEmail: (email: string) =>
    apiClient.post<ApiResponse<void>>('/user/email/send-verification', null, { params: { email } }),

  verifyEmail: async (email: string, code: string) => {
    const res = await apiClient.post<ApiResponse<{ verified: boolean; message: string }>>(
      '/user/email/verify',
      { email, code },
    )
    return unwrap(res)
  },

  signUp: (body: SignUpRequest) => apiClient.post<ApiResponse<void>>('/user/sign-up', body),

  signIn: async (body: SignInRequest) => {
    const res = await apiClient.post<ApiResponse<{ jwtToken: JwtToken }>>('/user/sign-in', body)
    return unwrap(res).jwtToken
  },

  refresh: async (refreshToken: string) => {
    const res = await apiClient.post<ApiResponse<{ jwtToken: JwtToken }>>('/user/refresh', { refreshToken })
    return unwrap(res).jwtToken
  },

  // Authorization 헤더는 client.ts 의 요청 인터셉터가 저장된 access token 으로 자동으로 붙인다.
  // BE 는 헤더 값에서 "Bearer " 를 잘라내고 나머지를 토큰으로 쓴다(UserService.logout).
  logout: () => apiClient.post<ApiResponse<void>>('/user/logout'),

  me: async () => {
    const res = await apiClient.get<ApiResponse<UserDetail>>('/user/me')
    return unwrap(res)
  },

  sendPasswordResetCode: (email: string) =>
    apiClient.post<ApiResponse<void>>('/user/password/send-reset-code', null, { params: { email } }),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    apiClient.post<ApiResponse<void>>('/user/password/reset', body),
}
