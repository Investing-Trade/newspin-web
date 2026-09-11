import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import { stockApi } from '../api/stock'
import type { TradeType } from '../api/domain'
import { useInvestmentReport } from '../hooks/useInvestmentReport'
import { useTradeHistory } from '../hooks/useTradeHistory'

export function SessionWorkspacePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = Number(sessionId)
  const queryClient = useQueryClient()

  const { data: daily } = useQuery({
    queryKey: ['daily-data', id],
    queryFn: () => simulationApi.getCurrentDayData(id),
  })
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => simulationApi.getPortfolio(id),
    enabled: !!daily,
  })
  // 전 종목 시세 — daily.simulationDate 기준(세션 현재일). lookahead 차단(C-5)이 적용된 값이라
  // 이 날짜 이후 시세는 애초에 응답에 없다.
  const { data: stocks } = useQuery({
    queryKey: ['stocks', 'price-range', daily?.simulationDate],
    queryFn: () => stockApi.getAllPriceRange(daily!.simulationDate),
    enabled: !!daily,
  })

  const [tradePage, setTradePage] = useState(0)
  const { data: trades } = useTradeHistory(id, { page: tradePage, size: 10 })
  // 리포트는 세션 종료(COMPLETED) 후에만 조회 — 첫 조회 자체가 생성을 트리거하므로
  // 아직 진행 중인 세션에서 불필요하게 Gemini 를 호출하지 않도록 막는다.
  const { data: report } = useInvestmentReport(id, daily?.status === 'COMPLETED')

  const [selectedStock, setSelectedStock] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [tradeError, setTradeError] = useState<string | null>(null)

  const invalidateSessionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-data', id] })
    queryClient.invalidateQueries({ queryKey: ['portfolio', id] })
    queryClient.invalidateQueries({ queryKey: ['trades', id] })
  }

  const nextDay = useMutation({
    mutationFn: () => simulationApi.proceedToNextDay(id),
    onSuccess: invalidateSessionQueries,
  })

  const complete = useMutation({
    mutationFn: () => simulationApi.completeSession(id),
    onSuccess: invalidateSessionQueries,
  })

  const trade = useMutation({
    mutationFn: (tradeType: TradeType) => {
      const stock = stocks?.find((s) => s.stockCode === selectedStock)
      const latestPrice = stock?.prices.at(-1)?.closePrice
      if (!stock || latestPrice === undefined) {
        throw new Error('종목 시세를 불러오지 못했습니다.')
      }
      // 서버가 세션 현재일 종가와 ±1% 안에서만 허용한다(C-3) — 방금 조회한 종가를 그대로 보낸다.
      return simulationApi.executeTrade(id, {
        stockCode: stock.stockCode,
        tradeType,
        quantity,
        price: latestPrice,
      })
    },
    onSuccess: invalidateSessionQueries,
    onError: () => setTradeError('거래에 실패했습니다. 잔고/보유수량 또는 시세 변동을 확인하세요.'),
  })

  if (!daily) return <p className="text-sm text-gray-500">불러오는 중…</p>

  const isActive = daily.status === 'ACTIVE'

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <h1 className="text-lg font-semibold">세션 #{id}</h1>
          <p className="text-sm text-gray-500">
            {daily.simulationDate} · {daily.status}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>총자산 {daily.totalAsset.toLocaleString()}원</p>
          <p className={daily.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}>
            누적 {daily.profitRate.toFixed(2)}% · 전일비 {daily.dailyProfitRate.toFixed(2)}%
          </p>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          disabled={!isActive || nextDay.isPending}
          onClick={() => nextDay.mutate()}
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          {nextDay.isPending ? '진행 중…' : '다음 날 진행'}
        </button>
        <button
          disabled={!isActive || complete.isPending}
          onClick={() => complete.mutate()}
          className="rounded border px-3 py-2 text-sm disabled:opacity-40"
        >
          세션 종료
        </button>
      </div>

      {daily.todayNews.length > 0 && (
        <section className="rounded border border-gray-200 p-4">
          <h2 className="mb-2 font-medium">오늘의 뉴스</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {daily.todayNews.map((n) => (
              <li key={n.newsId}>
                <span className="font-medium">{n.title}</span>
                {n.eventType && <span className="ml-2 text-xs text-amber-600">[{n.eventType}]</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-2 font-medium">매매</h2>
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            종목
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value="">선택</option>
              {stocks?.map((s) => (
                <option key={s.stockCode} value={s.stockCode}>
                  {s.stockName} ({s.prices.at(-1)?.closePrice.toLocaleString() ?? '-'}원)
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            수량
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <button
            disabled={!isActive || !selectedStock || trade.isPending}
            onClick={() => {
              setTradeError(null)
              trade.mutate('BUY')
            }}
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-40"
          >
            매수
          </button>
          <button
            disabled={!isActive || !selectedStock || trade.isPending}
            onClick={() => {
              setTradeError(null)
              trade.mutate('SELL')
            }}
            className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-40"
          >
            매도
          </button>
        </div>
        {tradeError && <p className="mt-2 text-sm text-red-600">{tradeError}</p>}
      </section>

      {portfolio && (
        <section className="rounded border border-gray-200 p-4">
          <h2 className="mb-2 font-medium">포트폴리오</h2>
          <p className="mb-2 text-sm text-gray-600">
            현금 {portfolio.currentCapital.toLocaleString()}원 · 주식평가액{' '}
            {portfolio.totalStockValue.toLocaleString()}원
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {portfolio.items.map((item) => (
              <li key={item.stockCode}>
                {item.stockName} {item.quantity}주 · 평가액 {item.totalValue.toLocaleString()}원 (
                {item.profitRate.toFixed(2)}%)
              </li>
            ))}
            {portfolio.items.length === 0 && <p className="text-gray-500">보유 종목 없음</p>}
          </ul>
        </section>
      )}

      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-2 font-medium">거래 내역</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {trades?.content.map((t) => (
            <li key={t.tradeId}>
              {t.tradeDate} {t.tradeType} {t.stockName} {t.quantity}주 @ {t.price.toLocaleString()}원
            </li>
          ))}
          {trades?.content.length === 0 && <p className="text-gray-500">거래 내역 없음</p>}
        </ul>
        {trades && trades.totalPages > 1 && (
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

      {/* I-11: status 로 분기 — GENERATING/FAILED 인 동안은 useInvestmentReport 가 자동 폴링.
          세션 종료 전에는 조회 자체를 안 하므로(위 enabled 참고) 이 섹션도 그때만 보여준다. */}
      {daily.status === 'COMPLETED' && (
        <section className="rounded border border-gray-200 p-4">
          <h2 className="mb-2 font-medium">투자 리포트</h2>
          {report?.status !== 'READY' && (
            <p className="text-sm text-gray-500">AI 분석 생성 중… ({report?.status ?? '로딩'})</p>
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
      )}
    </div>
  )
}
