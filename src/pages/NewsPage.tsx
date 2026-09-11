import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { newsApi } from '../api/news'
import type { NewsSentiment } from '../api/domain'

export function NewsPage() {
  const queryClient = useQueryClient()
  const { data: news, isLoading } = useQuery({
    queryKey: ['news', 'random'],
    queryFn: newsApi.getRandom,
  })
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof newsApi.analyze>> | null>(null)

  const analyze = useMutation({
    mutationFn: (sentiment: NewsSentiment) => newsApi.analyze(news!.newsId, sentiment, reason),
    onSuccess: setResult,
  })

  const next = () => {
    setResult(null)
    setReason('')
    queryClient.invalidateQueries({ queryKey: ['news', 'random'] })
  }

  if (isLoading) return <p className="p-6 text-sm text-gray-500">불러오는 중…</p>
  if (!news) return null

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">{news.title}</h1>
      <p className="mb-4 whitespace-pre-wrap text-sm text-gray-700">{news.content}</p>

      {!result && (
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="판단 이유"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              disabled={!reason || analyze.isPending}
              onClick={() => analyze.mutate('POSITIVE')}
              className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              호재
            </button>
            <button
              disabled={!reason || analyze.isPending}
              onClick={() => analyze.mutate('NEGATIVE')}
              className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              악재
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-2 rounded border border-gray-200 p-4 text-sm">
          <p>{result.isCorrect ? '정답' : '오답'} (AI 판단: {result.aiSentiment})</p>
          <p className="text-gray-600">{result.aiFeedback}</p>
          <button onClick={next} className="mt-2 self-start rounded border px-3 py-1">
            다음 뉴스
          </button>
        </div>
      )}
    </div>
  )
}
