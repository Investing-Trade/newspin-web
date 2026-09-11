import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { API_BASE_URL, SESSION_EXPIRED_EVENT, apiClient } from './client'
import { tokenStorage } from './tokenStorage'

/**
 * client.ts 의 401 → refresh → 재시도 인터셉터를 검증한다. I-16/I-17 이 아니라 이 저장소
 * (newspin-web) 쪽 로직 — refresh 마저 실패했을 때 SESSION_EXPIRED_EVENT 를 쏘는지가 핵심
 * (이전에 실제로 빠져있던 버그, PR #4 에서 채움).
 */
describe('apiClient 401 인터셉터', () => {
  let apiMock: MockAdapter
  let globalMock: MockAdapter

  beforeEach(() => {
    localStorage.clear()
    tokenStorage.setTokens('expired-access', 'valid-refresh')
    apiMock = new MockAdapter(apiClient)
    globalMock = new MockAdapter(axios)
  })

  afterEach(() => {
    apiMock.restore()
    globalMock.restore()
  })

  it('401 → refresh 성공 → 원 요청을 새 토큰으로 재시도한다', async () => {
    apiMock
      .onGet('/protected')
      .replyOnce(401)
      .onGet('/protected')
      .reply(200, { status: 'success', code: '200', message: 'OK', data: { ok: true } })
    globalMock.onPost(`${API_BASE_URL}/user/refresh`).reply(200, {
      status: 'success',
      code: '200',
      message: 'OK',
      data: { jwtToken: { grantType: 'Bearer', accessToken: 'new-access', refreshToken: 'new-refresh' } },
    })

    const res = await apiClient.get('/protected')

    expect(res.data.data).toEqual({ ok: true })
    expect(tokenStorage.getAccessToken()).toBe('new-access')
    expect(tokenStorage.getRefreshToken()).toBe('new-refresh')
    // 재시도 요청엔 새 토큰이 붙어야 한다
    expect(apiMock.history.get[1].headers?.Authorization).toBe('Bearer new-access')
  })

  it('refresh 마저 실패하면 세션 만료 이벤트를 쏘고 토큰을 지운다', async () => {
    apiMock.onGet('/protected').reply(401)
    globalMock.onPost(`${API_BASE_URL}/user/refresh`).reply(400, {
      status: 'error',
      code: 'C005',
      message: '유효하지 않은 토큰입니다.',
      data: null,
    })

    const onExpired = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)

    await expect(apiClient.get('/protected')).rejects.toBeTruthy()

    expect(onExpired).toHaveBeenCalledTimes(1)
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()

    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  })

  it('refresh token 이 아예 없으면 refresh 호출 없이 바로 실패한다', async () => {
    tokenStorage.clear()
    apiMock.onGet('/protected').reply(401)

    await expect(apiClient.get('/protected')).rejects.toBeTruthy()
    expect(globalMock.history.post.length).toBe(0)
  })

  it('/user/refresh 자체가 401 이어도 무한 루프에 빠지지 않는다', async () => {
    apiMock.onPost('/user/refresh').reply(401)

    await expect(apiClient.post('/user/refresh', {})).rejects.toBeTruthy()
    // refresh 엔드포인트 자체 요청은 재시도 대상에서 제외된다(client.ts 의 url 체크)
    expect(apiMock.history.post).toHaveLength(1)
  })
})
