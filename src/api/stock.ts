import { apiClient, unwrap } from './client'
import type { ApiResponse } from './types'

export interface StockPricePoint {
  date: string
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
  dailyChangeRate: number
  baseChangeRate: number
  isEventDate: boolean
}

export interface StockPriceHistory {
  stockId: number
  stockCode: string
  stockName: string
  sector: string
  prices: StockPricePoint[]
}

export const stockApi = {
  /**
   * 종목 1개의 `date` 기준일까지 시세(최대 11거래일). `date` 는 항상 세션의
   * `currentSimulationDate` 를 넘겨야 한다 — 서버가 그 이후는 절대 반환하지 않는다(lookahead 차단, C-5).
   */
  getPriceRange: async (stockCode: string, date: string) => {
    const res = await apiClient.get<ApiResponse<StockPriceHistory>>(`/stocks/${stockCode}/price-range`, {
      params: { date },
    })
    return unwrap(res)
  },

  getAllPriceRange: async (date: string) => {
    const res = await apiClient.get<ApiResponse<StockPriceHistory[]>>('/stocks/price-range', {
      params: { date },
    })
    return unwrap(res)
  },
}
