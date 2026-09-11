import { apiClient, unwrap } from './client'
import type { ReportStatus } from './domain'
import type { ApiResponse } from './types'

export interface InvestmentReport {
  sessionId: number
  startDate: string
  endDate: string
  initialCapital: number
  finalAsset: number
  totalProfitRate: number
  totalTradeCount: number
  buyCount: number
  sellCount: number
  /**
   * I-11: AI 분석 4개 섹션의 생성 상태.
   * - GENERATING: 방금 생성이 시작됨(또는 진행 중). 아래 4개 필드는 전부 null. 폴링 계속.
   * - READY: 4개 필드 전부 채워짐.
   * - FAILED: 생성 실패. 다음 조회 시 서버가 자동 재시도하므로 계속 폴링해도 된다.
   * HTTP 상태코드도 같이 참고할 것 — READY 만 200, 나머지는 202.
   */
  status: ReportStatus
  overallAnalysis: string | null
  newsResponseAnalysis: string | null
  riskManagementAnalysis: string | null
  improvementSuggestions: string | null
  generatedAt: string | null
}

export const reportApi = {
  /**
   * 규칙 기반 요약(자산/수익률/거래수)은 즉시 채워져서 온다. AI 분석 4개 섹션은
   * status==='READY' 일 때만 채워진다 — 그 전까지는 이 함수를 폴링해야 한다.
   * (권장 폴링 주기: 2~3초. `useInvestmentReport` 훅이 이 패턴을 감싸둠.)
   */
  getReport: async (sessionId: number) => {
    const res = await apiClient.get<ApiResponse<InvestmentReport>>(`/simulation/sessions/${sessionId}/report`)
    return unwrap(res)
  },
}
