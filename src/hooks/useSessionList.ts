import { useQuery } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import type { PageParams } from '../api/types'

/** I-10 페이지네이션 목록 API 사용 예시. `page`가 바뀔 때마다 다시 조회. */
export function useSessionList(params: PageParams) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => simulationApi.getMySessions(params),
    placeholderData: (previousData) => previousData, // 페이지 전환 시 깜빡임 방지
  })
}
