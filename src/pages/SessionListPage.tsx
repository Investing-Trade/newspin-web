import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { simulationApi } from '../api/simulation'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingState } from '../components/ui/LoadingState'
import { useSessionList } from '../hooks/useSessionList'

const PAGE_SIZE = 20

export function SessionListPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useSessionList({ page, size: PAGE_SIZE })
  const queryClient = useQueryClient()

  const abandon = useMutation({
    mutationFn: (sessionId: number) => simulationApi.abandonSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">내 모의투자 세션</h1>
        <Link
          to="/sessions/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          새 세션
        </Link>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorMessage>목록을 불러오지 못했습니다.</ErrorMessage>}

      {data && (
        <>
          <ul className="flex flex-col gap-2">
            {data.content.map((session) => (
              <li
                key={session.sessionId}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 px-4 py-3 text-sm hover:bg-gray-50"
              >
                <Link to={`/sessions/${session.sessionId}`} className="min-w-0 flex-1">
                  <span className="font-medium">#{session.sessionId}</span>{' '}
                  <span className="text-gray-500">
                    {session.startDate} ~ {session.endDate} · {session.status}
                  </span>
                </Link>
                {session.status === 'ACTIVE' && (
                  <button
                    disabled={abandon.isPending}
                    onClick={(e) => {
                      e.preventDefault()
                      if (confirm(`세션 #${session.sessionId}을(를) 포기할까요?`)) {
                        abandon.mutate(session.sessionId)
                      }
                    }}
                    className="shrink-0 text-xs text-gray-400 hover:text-red-600 disabled:opacity-40"
                  >
                    포기
                  </button>
                )}
              </li>
            ))}
            {data.content.length === 0 && <p className="text-sm text-gray-500">세션이 없습니다.</p>}
          </ul>

          {/* I-10: PageResponse 의 hasNext/totalPages 로 페이지네이션 UI 구성 */}
          <div className="mt-4 flex items-center gap-3 text-sm">
            <Button
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2 py-1"
            >
              이전
            </Button>
            <span aria-live="polite">
              {data.page + 1} / {Math.max(data.totalPages, 1)}
            </span>
            <Button
              variant="secondary"
              disabled={!data.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1"
            >
              다음
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
