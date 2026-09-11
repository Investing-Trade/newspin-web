/**
 * BE(`newspin-be`) 공통 응답 계약.
 * 참고: docs/api-contract.md, ../../../newspin-be/src/main/java/org/gp/newspinbe/global/common/
 */

/** 모든 API 응답의 겉껍질. 성공/실패 모두 이 구조로 온다. */
export interface ApiResponse<T> {
  status: 'success' | 'error'
  code: string
  message: string
  data: T | null
}

/**
 * 목록 API 공통 응답(I-10). `/simulation/sessions`, `/simulation/sessions/{id}/trades` 등이
 * 배열 대신 이 형태로 응답한다. 기본 page=0, size=20, 서버 최대 size=100(넘기면 서버가 캡).
 */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/** 페이지 요청 파라미터. Spring `Pageable` 바인딩과 맞춤(`page`,`size`,`sort`). */
export interface PageParams {
  page?: number
  size?: number
  sort?: string
}
