/**
 * access/refresh token 을 localStorage 에 보관. 별도 상태관리 없이 axios 인터셉터와
 * AuthContext 양쪽에서 같은 소스를 보게 하기 위한 얇은 유틸.
 */
const ACCESS_TOKEN_KEY = 'np_access_token'
const REFRESH_TOKEN_KEY = 'np_refresh_token'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
