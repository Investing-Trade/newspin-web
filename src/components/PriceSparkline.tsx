import type { StockPricePoint } from '../api/stock'

const WIDTH = 240
const HEIGHT = 60
const PADDING = 4

/**
 * 선택한 종목의 최근 시세(최대 11거래일, C-5 lookahead 차단이 적용된 값) 흐름을 보여주는
 * 미니 라인 차트. 별도 차트 라이브러리 없이 순수 SVG로 그린다 — 포인트 수가 적고(≤11)
 * 상호작용(줌/툴팁)이 필요 없어 라이브러리를 들일 이유가 없다.
 */
export function PriceSparkline({ prices }: { prices: StockPricePoint[] }) {
  if (prices.length < 2) {
    return <p className="text-xs text-gray-400">시세 이력이 부족합니다.</p>
  }

  const closes = prices.map((p) => p.closePrice)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1

  const toXY = (i: number, close: number): [number, number] => {
    const x = PADDING + (i / (prices.length - 1)) * (WIDTH - PADDING * 2)
    const y = HEIGHT - PADDING - ((close - min) / range) * (HEIGHT - PADDING * 2)
    return [x, y]
  }

  const points = prices.map((p, i) => toXY(i, p.closePrice))
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const first = closes[0]
  const last = closes.at(-1)!
  const isUp = last >= first
  // 국내 증권 앱 관례: 상승=빨강(rose-600), 하락=파랑(blue-600) — Button/테이블과 동일 색상 사용.
  const stroke = isUp ? '#e11d48' : '#2563eb'

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} className="overflow-visible">
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={prices[i].isEventDate ? 2.5 : 1.5}
          fill={prices[i].isEventDate ? '#d97706' : stroke}
        />
      ))}
    </svg>
  )
}
