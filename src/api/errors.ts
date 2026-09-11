import { isAxiosError } from 'axios'

import type { ApiResponse } from './types'

/**
 * BE 는 실패 시 `{status:"error", code, message, data:null}` 형태로 항상 사람이 읽을 메시지를
 * 준다(예: C902 "AI 분석 서비스를 일시적으로 사용할 수 없습니다..."). 지금까지 각 페이지가 이
 * 메시지를 무시하고 자기 나름의 고정 문구만 보여주고 있었다 — 그 메시지를 우선 쓰고, 못 꺼내는
 * 경우(네트워크 끊김, 401 raw 응답 등 — client.ts 주석 참고)에만 fallback 을 쓴다.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiResponse<unknown>>(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return fallback
}
