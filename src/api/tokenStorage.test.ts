import { beforeEach, describe, expect, it } from 'vitest'

import { tokenStorage } from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('토큰이 없으면 null을 반환한다', () => {
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('setTokens 로 저장한 값을 그대로 읽어온다', () => {
    tokenStorage.setTokens('access-1', 'refresh-1')
    expect(tokenStorage.getAccessToken()).toBe('access-1')
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1')
  })

  it('clear 하면 둘 다 지워진다', () => {
    tokenStorage.setTokens('access-1', 'refresh-1')
    tokenStorage.clear()
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })
})
