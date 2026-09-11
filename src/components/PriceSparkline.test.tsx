import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { StockPricePoint } from '../api/stock'
import { PriceSparkline } from './PriceSparkline'

function point(overrides: Partial<StockPricePoint>): StockPricePoint {
  return {
    date: '2020-01-02',
    openPrice: 100,
    closePrice: 100,
    highPrice: 100,
    lowPrice: 100,
    volume: 1000,
    dailyChangeRate: 0,
    baseChangeRate: 0,
    isEventDate: false,
    ...overrides,
  }
}

describe('PriceSparkline', () => {
  it('시세 이력이 2개 미만이면 안내 문구만 보여준다', () => {
    render(<PriceSparkline prices={[point({ closePrice: 100 })]} />)
    expect(screen.getByText('시세 이력이 부족합니다.')).toBeInTheDocument()
    expect(document.querySelector('svg')).not.toBeInTheDocument()
  })

  it('종가가 오르면 국내 관례상 상승 색(빨강)으로 그린다', () => {
    const prices = [point({ closePrice: 100 }), point({ closePrice: 110 })]
    const { container } = render(<PriceSparkline prices={prices} />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('stroke', '#e11d48')
  })

  it('종가가 내리면 국내 관례상 하락 색(파랑)으로 그린다', () => {
    const prices = [point({ closePrice: 100 }), point({ closePrice: 90 })]
    const { container } = render(<PriceSparkline prices={prices} />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('stroke', '#2563eb')
  })

  it('이벤트 뉴스 발생일은 원을 더 크게(강조) 그린다', () => {
    const prices = [point({ closePrice: 100 }), point({ closePrice: 105, isEventDate: true })]
    const { container } = render(<PriceSparkline prices={prices} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    expect(circles[0]).toHaveAttribute('r', '1.5')
    expect(circles[1]).toHaveAttribute('r', '2.5')
    expect(circles[1]).toHaveAttribute('fill', '#d97706')
  })

  it('포인트 수만큼 path 좌표를 생성한다', () => {
    const prices = [point({ closePrice: 100 }), point({ closePrice: 105 }), point({ closePrice: 95 })]
    const { container } = render(<PriceSparkline prices={prices} />)
    const path = container.querySelector('path')!.getAttribute('d')!
    // M + L + L = 3 개 좌표 명령
    expect(path.match(/[ML]/g)).toHaveLength(3)
  })
})
