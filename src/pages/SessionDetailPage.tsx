import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import { useTradeHistory } from '../hooks/useTradeHistory'
import { useInvestmentReport } from '../hooks/useInvestmentReport'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = Number(sessionId)
  const [tradePage, setTradePage] = useState(0)

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => simulationApi.getPortfolio(id),
  })
  const { data: trades } = useTradeHistory(id, { page: tradePage, size: 10 })
  const { data: report } = useInvestmentReport(id)

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-4 text-xl font-semibold">세션 #{id}</h1>

      {portfolio && (
        <section className="mb-6 rounded border border-gray-200 p-4">
          <h2 className="mb-2 font-medium">포트폴리오</h2>
          <p className="text-sm text-gray-600">
            총자산 {portfolio.totalAsset.toLocaleString()}원 · 수익률 {portfolio.totalProfitRate.toFixed(2)}%
          </p>
        </section>
      )}

      <section className="mb-6 rounded border border-gray-200 p-4">
        <h2 className="mb-2 font-medium">거래 내역</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {trades?.content.map((t) => (
            <li key={t.tradeId}>
              {t.tradeDate} {t.tradeType} {t.stockName} {t.quantity}주 @ {t.price.toLocaleString()}원
            </li>
          ))}
        </ul>
        {trades && (
          <div className="mt-2 flex gap-2 text-sm">
            <button disabled={tradePage === 0} onClick={() => setTradePage((p) => p - 1)}>
              이전
            </button>
            <button disabled={!trades.hasNext} onClick={() => setTradePage((p) => p + 1)}>
              다음
            </button>
          </div>
        )}
      </section>

      {/* I-11: report.status 로 분기 — GENERATING/FAILED 인 동안은 useInvestmentReport 가 자동 폴링 중 */}
      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-2 font-medium">투자 리포트</h2>
        {report?.status !== 'READY' && (
          <p className="text-sm text-gray-500">
            AI 분석 생성 중… ({report?.status ?? '로딩'})
          </p>
        )}
        {report?.status === 'READY' && (
          <div className="flex flex-col gap-3 text-sm">
            <p>{report.overallAnalysis}</p>
            <p>{report.newsResponseAnalysis}</p>
            <p>{report.riskManagementAnalysis}</p>
            <p>{report.improvementSuggestions}</p>
          </div>
        )}
      </section>
    </div>
  )
}
