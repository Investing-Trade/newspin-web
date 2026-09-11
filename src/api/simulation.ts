import { apiClient, unwrap } from './client'
import type { NewsArticle } from './news'
import type { SessionStatus, TradeType } from './domain'
import type { ApiResponse, PageParams, PageResponse } from './types'

export interface Session {
  sessionId: number
  userId: number
  initialCapital: number
  currentCapital: number
  startDate: string
  endDate: string
  currentSimulationDate: string
  status: SessionStatus
  createdAt: string
  updatedAt: string
}

export interface DayData {
  sessionId: number
  simulationDate: string
  currentCapital: number
  totalAsset: number
  profitRate: number
  dailyProfitRate: number
  status: SessionStatus
  todayNews: NewsArticle[]
}

export interface PortfolioItem {
  stockCode: string
  stockName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  profitRate: number
}

export interface PortfolioOverview {
  currentCapital: number
  totalStockValue: number
  totalAsset: number
  totalProfitRate: number
  items: PortfolioItem[]
}

export interface Trade {
  tradeId: number
  sessionId: number
  stockCode: string
  stockName: string
  tradeType: TradeType
  quantity: number
  price: number
  totalAmount: number
  tradeDate: string
  currentCapital: number
  createdAt: string
}

export const simulationApi = {
  createSession: async (body: { initialCapital: number; startDate: string; endDate: string }) => {
    const res = await apiClient.post<ApiResponse<Session>>('/simulation/sessions', body)
    return unwrap(res)
  },

  /** 목록 API — I-10. 기본 page=0/size=20, 서버 최대 size=100. */
  getMySessions: async (params?: PageParams) => {
    const res = await apiClient.get<ApiResponse<PageResponse<Session>>>('/simulation/sessions', { params })
    return unwrap(res)
  },

  getSession: async (sessionId: number) => {
    const res = await apiClient.get<ApiResponse<Session>>(`/simulation/sessions/${sessionId}`)
    return unwrap(res)
  },

  proceedToNextDay: async (sessionId: number) => {
    const res = await apiClient.post<ApiResponse<DayData>>(`/simulation/sessions/${sessionId}/next-day`)
    return unwrap(res)
  },

  getCurrentDayData: async (sessionId: number) => {
    const res = await apiClient.get<ApiResponse<DayData>>(`/simulation/sessions/${sessionId}/daily-data`)
    return unwrap(res)
  },

  getPortfolio: async (sessionId: number) => {
    const res = await apiClient.get<ApiResponse<PortfolioOverview>>(`/simulation/sessions/${sessionId}/portfolio`)
    return unwrap(res)
  },

  abandonSession: (sessionId: number) => apiClient.delete<ApiResponse<void>>(`/simulation/sessions/${sessionId}`),

  completeSession: async (sessionId: number) => {
    const res = await apiClient.put<ApiResponse<Session>>(`/simulation/sessions/${sessionId}/complete`)
    return unwrap(res)
  },

  /**
   * 체결가는 서버가 세션 현재일 종가 기준 ±1% 범위에서만 허용한다(C-3) — 클라이언트가 보낸
   * `price` 는 서버 시세와 벗어나면 409(`PRICE_MISMATCH`)로 거절되고, 실제 체결가는 항상
   * 서버 시세로 확정된다. 정상 흐름에서는 방금 조회한 종가를 그대로 보내면 된다.
   */
  executeTrade: async (
    sessionId: number,
    body: { stockCode: string; tradeType: TradeType; quantity: number; price: number },
  ) => {
    const res = await apiClient.post<ApiResponse<Trade>>(`/simulation/sessions/${sessionId}/trades`, body)
    return unwrap(res)
  },

  /** 거래 내역 — I-10 페이지네이션. */
  getTradeHistory: async (sessionId: number, params?: PageParams) => {
    const res = await apiClient.get<ApiResponse<PageResponse<Trade>>>(
      `/simulation/sessions/${sessionId}/trades`,
      { params },
    )
    return unwrap(res)
  },
}
