import { useId, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { newsApi } from '../api/news'
import type { NewsSentiment } from '../api/domain'
import { getErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingState } from '../components/ui/LoadingState'

export function NewsPage() {
  const queryClient = useQueryClient()
  const reasonId = useId()
  const { data: news, isLoading } = useQuery({
    queryKey: ['news', 'random'],
    queryFn: newsApi.getRandom,
  })
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof newsApi.analyze>> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = useMutation({
    mutationFn: (sentiment: NewsSentiment) => newsApi.analyze(news!.newsId, sentiment, reason),
    onSuccess: (data) => {
      setError(null)
      setResult(data)
    },
    onError: (err) => {
      // BE 가 실제로 주는 메시지를 그대로 보여준다 — 예: AI 서버 장애 시 C902
      // "AI 분석 서비스를 일시적으로 사용할 수 없습니다..." 처럼 원인이 구체적으로 다르다.
      setError(getErrorMessage(err, '판단 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'))
    },
  })

  const next = () => {
    setResult(null)
    setError(null)
    setReason('')
    queryClient.invalidateQueries({ queryKey: ['news', 'random'] })
  }

  if (isLoading) return <LoadingState />
  if (!news) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">{news.title}</h1>
      <p className="mb-4 whitespace-pre-wrap text-sm text-gray-700">{news.content}</p>

      {!result && (
        <div className="flex flex-col gap-3">
          <label htmlFor={reasonId} className="text-sm font-medium text-gray-700">
            판단 이유
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-2 focus:outline-offset-1 focus:outline-gray-400"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="buy" disabled={!reason || analyze.isPending} onClick={() => analyze.mutate('POSITIVE')}>
              호재
            </Button>
            <Button variant="sell" disabled={!reason || analyze.isPending} onClick={() => analyze.mutate('NEGATIVE')}>
              악재
            </Button>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-2 rounded border border-gray-200 p-4 text-sm">
          <p>
            {result.isCorrect ? '정답' : '오답'} (AI 판단: {result.aiSentiment})
          </p>
          <p className="text-gray-600">{result.aiFeedback}</p>
          <Button variant="secondary" onClick={next} className="mt-2 self-start">
            다음 뉴스
          </Button>
        </div>
      )}
    </div>
  )
}
