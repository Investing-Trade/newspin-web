import { useQuery } from '@tanstack/react-query'

import { reportApi } from '../api/report'

const POLL_INTERVAL_MS = 2500

/**
 * I-11: 투자 리포트는 비동기로 생성된다. 이 훅은 상태가 `GENERATING`/`FAILED` 인 동안
 * 자동으로 재조회(폴링)하고, `READY` 가 되면 멈춘다. 화면 쪽에서는 폴링 여부를 신경 쓸 필요 없이
 * `report.status` 만 보고 렌더링을 분기하면 된다.
 *
 * `enabled`: 첫 조회 자체가 리포트 생성을 트리거하므로(GENERATING 행 생성 + Gemini 호출),
 * 세션이 아직 진행 중(ACTIVE)일 때는 `false` 로 넘겨 불필요한 생성을 막을 것.
 */
export function useInvestmentReport(sessionId: number, enabled = true) {
  return useQuery({
    queryKey: ['report', sessionId],
    queryFn: () => reportApi.getReport(sessionId),
    enabled,
    refetchInterval: (query) => (query.state.data?.status === 'READY' ? false : POLL_INTERVAL_MS),
  })
}
