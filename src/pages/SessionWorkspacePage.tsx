import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import { stockApi } from '../api/stock'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingState } from '../components/ui/LoadingState'
import { PriceSparkline } from '../components/PriceSparkline'
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
  const selectedStockInfo = stocks?.find((s) => s.stockCode === selectedStock)

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

  if (!daily) return <LoadingState />

  const isActive = daily.status === 'ACTIVE'

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">세션 #{id}</h1>
          <p className="text-sm text-gray-500">
            {daily.simulationDate} · {daily.status}
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p>총자산 {daily.totalAsset.toLocaleString()}원</p>
          <p className={daily.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}>
            누적 {daily.profitRate.toFixed(2)}% · 전일비 {daily.dailyProfitRate.toFixed(2)}%
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!isActive || nextDay.isPending} onClick={() => nextDay.mutate()}>
          {nextDay.isPending ? '진행 중…' : '다음 날 진행'}
        </Button>
        <Button variant="secondary" disabled={!isActive || complete.isPending} onClick={() => complete.mutate()}>
          세션 종료
        </Button>
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
              className="rounded border border-gray-300 px-2 py-1 focus:border-gray-500 focus:outline-2 focus:outline-offset-1 focus:outline-gray-400"
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
              className="w-20 rounded border border-gray-300 px-2 py-1 focus:border-gray-500 focus:outline-2 focus:outline-offset-1 focus:outline-gray-400"
            />
          </label>
          <Button
            variant="success"
            disabled={!isActive || !selectedStock || trade.isPending}
            onClick={() => {
              setTradeError(null)
              trade.mutate('BUY')
            }}
          >
            매수
          </Button>
          <Button
            variant="danger"
            disabled={!isActive || !selectedStock || trade.isPending}
            onClick={() => {
              setTradeError(null)
              trade.mutate('SELL')
            }}
          >
            매도
          </Button>
        </div>
        {tradeError && <ErrorMessage>{tradeError}</ErrorMessage>}
        {selectedStockInfo && (
          <div className="mt-3 overflow-x-auto">
            <p className="mb-1 text-xs text-gray-500">
              최근 {selectedStockInfo.prices.length}거래일 (주황 점 = 이벤트 뉴스 발생일)
            </p>
            <PriceSparkline prices={selectedStockInfo.prices} />
          </div>
        )}
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
            <Button variant="secondary" disabled={tradePage === 0} onClick={() => setTradePage((p) => p - 1)} className="px-2 py-1">
              이전
            </Button>
            <Button variant="secondary" disabled={!trades.hasNext} onClick={() => setTradePage((p) => p + 1)} className="px-2 py-1">
              다음
            </Button>
          </div>
        )}
      </section>

      {/* I-11: status 로 분기 — GENERATING/FAILED 인 동안은 useInvestmentReport 가 자동 폴링.
          세션 종료 전에는 조회 자체를 안 하므로(위 enabled 참고) 이 섹션도 그때만 보여준다. */}
      {daily.status === 'COMPLETED' && (
        <section className="rounded border border-gray-200 p-4">
          <h2 className="mb-2 font-medium">투자 리포트</h2>
          {report?.status !== 'READY' && (
            <p role="status" aria-live="polite" className="text-sm text-gray-500">
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
      )}
    </div>
  )
}
