import { useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import { stockApi } from '../api/stock'
import { getErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingState } from '../components/ui/LoadingState'
import { PriceSparkline } from '../components/PriceSparkline'
import { formatSignedPercent, priceChangeClass } from '../lib/priceColor'
import type { TradeType } from '../api/domain'
import { useInvestmentReport } from '../hooks/useInvestmentReport'
import { useTradeHistory } from '../hooks/useTradeHistory'

export function SessionWorkspacePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const id = Number(sessionId)
  const queryClient = useQueryClient()
  const quantityId = useId()

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
  const latestPrice = selectedStockInfo?.prices.at(-1)
  const holding = portfolio?.items.find((i) => i.stockCode === selectedStock)
  const orderTotal = latestPrice ? latestPrice.closePrice * quantity : 0
  const portfolioByStock = new Map((portfolio?.items ?? []).map((i) => [i.stockCode, i]))

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
      const price = stock?.prices.at(-1)?.closePrice
      if (!stock || price === undefined) {
        throw new Error('종목 시세를 불러오지 못했습니다.')
      }
      // 서버가 세션 현재일 종가와 ±1% 안에서만 허용한다(C-3) — 방금 조회한 종가를 그대로 보낸다.
      return simulationApi.executeTrade(id, { stockCode: stock.stockCode, tradeType, quantity, price })
    },
    onSuccess: invalidateSessionQueries,
    onError: (err) => setTradeError(getErrorMessage(err, '거래에 실패했습니다.')),
  })

  if (!daily) return <LoadingState />

  const isActive = daily.status === 'ACTIVE'
  const canSubmitOrder = isActive && !!selectedStock && quantity > 0 && !trade.isPending

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
          <p className={priceChangeClass(daily.profitRate)}>
            누적 {formatSignedPercent(daily.profitRate)} · 전일비 {formatSignedPercent(daily.dailyProfitRate)}
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
        {!isActive && (
          <span className="self-center text-xs text-gray-500">
            이 세션은 {daily.status === 'COMPLETED' ? '종료' : '포기'}되어 더 진행할 수 없습니다.
          </span>
        )}
      </div>

      {daily.todayNews.length > 0 && (
        <section className="rounded border border-gray-200 p-4">
          <h2 className="mb-1 font-medium">오늘의 뉴스</h2>
          <p className="mb-2 text-xs text-gray-400">제목을 눌러 본문을 볼 수 있어요.</p>
          <ul className="flex flex-col gap-1 text-sm">
            {daily.todayNews.map((n) => (
              <li key={n.newsId} className="group border-b border-gray-100 py-1 last:border-0">
                <details>
                  <summary className="flex cursor-pointer list-none items-baseline gap-1.5 rounded px-1 py-1 marker:hidden hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                    <span
                      aria-hidden
                      className="mt-0.5 text-gray-400 transition-transform duration-150 group-open:rotate-90"
                    >
                      ▶
                    </span>
                    <span className="font-medium underline decoration-gray-300 decoration-dashed underline-offset-2">
                      {n.title}
                    </span>
                    {n.eventType && <span className="text-xs text-amber-600">[{n.eventType}]</span>}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap pl-5 text-gray-600">{n.content}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-2 font-medium">매매</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-1.5 pr-2 font-normal">종목</th>
                  <th className="py-1.5 pr-2 font-normal text-right">현재가</th>
                  <th className="py-1.5 pr-2 font-normal text-right">전일대비</th>
                  <th className="py-1.5 font-normal text-right">보유수량</th>
                </tr>
              </thead>
              <tbody>
                {stocks?.map((s) => {
                  const latest = s.prices.at(-1)
                  const held = portfolioByStock.get(s.stockCode)
                  const radioId = `stock-${s.stockCode}`
                  return (
                    <tr key={s.stockCode} className={selectedStock === s.stockCode ? 'bg-gray-50' : ''}>
                      <td className="py-1.5 pr-2">
                        <label htmlFor={radioId} className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            id={radioId}
                            name="selected-stock"
                            value={s.stockCode}
                            checked={selectedStock === s.stockCode}
                            onChange={() => setSelectedStock(s.stockCode)}
                          />
                          {s.stockName}
                        </label>
                      </td>
                      <td className="py-1.5 pr-2 text-right">{latest?.closePrice.toLocaleString() ?? '-'}원</td>
                      <td className={`py-1.5 pr-2 text-right ${priceChangeClass(latest?.dailyChangeRate ?? 0)}`}>
                        {latest ? formatSignedPercent(latest.dailyChangeRate) : '-'}
                      </td>
                      <td className="py-1.5 text-right">{held ? `${held.quantity}주` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 rounded border border-gray-100 bg-gray-50 p-3 text-sm">
            <h3 className="font-medium">주문</h3>
            {!selectedStockInfo && <p className="text-gray-500">왼쪽 목록에서 종목을 선택하세요.</p>}
            {selectedStockInfo && latestPrice && (
              <>
                <p className="font-medium">{selectedStockInfo.stockName}</p>
                <p>
                  현재가 {latestPrice.closePrice.toLocaleString()}원{' '}
                  <span className={priceChangeClass(latestPrice.dailyChangeRate)}>
                    {formatSignedPercent(latestPrice.dailyChangeRate)}
                  </span>
                </p>
                <p className="text-gray-500">
                  {holding ? `보유 ${holding.quantity}주 (평가 ${holding.totalValue.toLocaleString()}원)` : '보유 없음'}
                </p>
                <label htmlFor={quantityId} className="mt-1 flex flex-col gap-1">
                  수량
                  <input
                    id={quantityId}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded border border-gray-300 px-2 py-1 focus:border-gray-500 focus:outline-2 focus:outline-offset-1 focus:outline-gray-400"
                  />
                </label>
                <p className="font-medium">주문 금액 {orderTotal.toLocaleString()}원</p>
                <p className="text-xs text-gray-500">주문가능 현금 {daily.currentCapital.toLocaleString()}원</p>
                <div className="mt-1 flex gap-2">
                  <Button
                    variant="buy"
                    className="flex-1"
                    disabled={!canSubmitOrder}
                    onClick={() => {
                      setTradeError(null)
                      trade.mutate('BUY')
                    }}
                  >
                    매수
                  </Button>
                  <Button
                    variant="sell"
                    className="flex-1"
                    disabled={!canSubmitOrder}
                    onClick={() => {
                      setTradeError(null)
                      trade.mutate('SELL')
                    }}
                  >
                    매도
                  </Button>
                </div>
                {tradeError && <ErrorMessage>{tradeError}</ErrorMessage>}
                <div className="mt-2 overflow-x-auto">
                  <p className="mb-1 text-xs text-gray-500">
                    최근 {selectedStockInfo.prices.length}거래일 (주황 점 = 이벤트 뉴스 발생일)
                  </p>
                  <PriceSparkline prices={selectedStockInfo.prices} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {portfolio && (
        <section className="rounded border border-gray-200 p-4">
          <h2 className="mb-2 font-medium">포트폴리오</h2>
          <p className="mb-3 text-sm text-gray-600">
            현금 {portfolio.currentCapital.toLocaleString()}원 · 주식평가액{' '}
            {portfolio.totalStockValue.toLocaleString()}원 · 총수익률{' '}
            <span className={priceChangeClass(portfolio.totalProfitRate)}>
              {formatSignedPercent(portfolio.totalProfitRate)}
            </span>
          </p>
          {portfolio.items.length === 0 ? (
            <p className="text-sm text-gray-500">보유 종목 없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-1.5 pr-2 font-normal">종목</th>
                    <th className="py-1.5 pr-2 font-normal text-right">보유수량</th>
                    <th className="py-1.5 pr-2 font-normal text-right">평균매입가</th>
                    <th className="py-1.5 pr-2 font-normal text-right">현재가</th>
                    <th className="py-1.5 pr-2 font-normal text-right">평가금액</th>
                    <th className="py-1.5 font-normal text-right">수익률</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.items.map((item) => (
                    <tr key={item.stockCode}>
                      <td className="py-1.5 pr-2">{item.stockName}</td>
                      <td className="py-1.5 pr-2 text-right">{item.quantity}주</td>
                      <td className="py-1.5 pr-2 text-right">{item.averagePrice.toLocaleString()}원</td>
                      <td className="py-1.5 pr-2 text-right">{item.currentPrice.toLocaleString()}원</td>
                      <td className="py-1.5 pr-2 text-right">{item.totalValue.toLocaleString()}원</td>
                      <td className={`py-1.5 text-right ${priceChangeClass(item.profitRate)}`}>
                        {formatSignedPercent(item.profitRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-2 font-medium">거래 내역</h2>
        {trades?.content.length === 0 ? (
          <p className="text-sm text-gray-500">거래 내역 없음</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-1.5 pr-2 font-normal">날짜</th>
                  <th className="py-1.5 pr-2 font-normal">구분</th>
                  <th className="py-1.5 pr-2 font-normal">종목</th>
                  <th className="py-1.5 pr-2 font-normal text-right">수량</th>
                  <th className="py-1.5 pr-2 font-normal text-right">단가</th>
                  <th className="py-1.5 font-normal text-right">총액</th>
                </tr>
              </thead>
              <tbody>
                {trades?.content.map((t) => (
                  <tr key={t.tradeId}>
                    <td className="py-1.5 pr-2">{t.tradeDate}</td>
                    <td className={`py-1.5 pr-2 font-medium ${t.tradeType === 'BUY' ? 'text-rose-600' : 'text-blue-600'}`}>
                      {t.tradeType === 'BUY' ? '매수' : '매도'}
                    </td>
                    <td className="py-1.5 pr-2">{t.stockName}</td>
                    <td className="py-1.5 pr-2 text-right">{t.quantity}주</td>
                    <td className="py-1.5 pr-2 text-right">{t.price.toLocaleString()}원</td>
                    <td className="py-1.5 text-right">{t.totalAmount.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {trades && trades.totalPages > 1 && (
          <div className="mt-2 flex gap-2 text-sm">
            <Button
              variant="secondary"
              disabled={tradePage === 0}
              onClick={() => setTradePage((p) => p - 1)}
              className="px-2 py-1"
            >
              이전
            </Button>
            <Button
              variant="secondary"
              disabled={!trades.hasNext}
              onClick={() => setTradePage((p) => p + 1)}
              className="px-2 py-1"
            >
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
