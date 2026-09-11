import { apiClient, unwrap } from './client'
import type { EventType, NewsSentiment } from './domain'
import type { ApiResponse } from './types'

export interface NewsArticle {
  newsId: number
  title: string
  content: string
  articleDate: string // ISO date (YYYY-MM-DD)
  source: string
  sentiment: NewsSentiment
  eventType: EventType | null // null = 일반 뉴스, 있으면 이벤트 뉴스
}

export interface AiAnalysisResult {
  aiSentiment: NewsSentiment
  aiFeedback: string
  isCorrect: boolean
}

export const newsApi = {
  getRandom: async () => {
    const res = await apiClient.get<ApiResponse<NewsArticle>>('/news/random')
    return unwrap(res)
  },

  /** 사용자의 호재/악재 판단 제출 → AI 채점 + 튜터 피드백. */
  analyze: async (newsId: number, sentiment: NewsSentiment, reason: string) => {
    const res = await apiClient.post<ApiResponse<AiAnalysisResult>>(`/news/${newsId}/analyze`, {
      sentiment,
      reason,
    })
    return unwrap(res)
  },
}
