import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useSessionList } from '../hooks/useSessionList'

const PAGE_SIZE = 20

export function SessionListPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useSessionList({ page, size: PAGE_SIZE })

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-4 text-xl font-semibold">내 모의투자 세션</h1>

      {isLoading && <p className="text-sm text-gray-500">불러오는 중…</p>}
      {isError && <p className="text-sm text-red-600">목록을 불러오지 못했습니다.</p>}

      {data && (
        <>
          <ul className="flex flex-col gap-2">
            {data.content.map((session) => (
              <li key={session.sessionId}>
                <Link
                  to={`/sessions/${session.sessionId}`}
                  className="block rounded border border-gray-200 px-4 py-3 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium">#{session.sessionId}</span>{' '}
                  <span className="text-gray-500">
                    {session.startDate} ~ {session.endDate} · {session.status}
                  </span>
                </Link>
              </li>
            ))}
            {data.content.length === 0 && <p className="text-sm text-gray-500">세션이 없습니다.</p>}
          </ul>

          {/* I-10: PageResponse 의 hasNext/totalPages 로 페이지네이션 UI 구성 */}
          <div className="mt-4 flex items-center gap-3 text-sm">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              이전
            </button>
            <span>
              {data.page + 1} / {Math.max(data.totalPages, 1)}
            </span>
            <button
              disabled={!data.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  )
}
