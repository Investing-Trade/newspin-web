import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { simulationApi } from '../api/simulation'

const DEFAULT_START = '2020-01-02'
const DEFAULT_END = '2020-03-31'
const MIN_CAPITAL = 1_000_000

export function CreateSessionPage() {
  const navigate = useNavigate()
  const [initialCapital, setInitialCapital] = useState(String(MIN_CAPITAL * 10))
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const session = await simulationApi.createSession({
        initialCapital: Number(initialCapital),
        startDate,
        endDate,
      })
      navigate(`/sessions/${session.sessionId}`)
    } catch {
      setError('세션 생성에 실패했습니다. 초기 자본은 최소 100만원, 시작일은 종료일보다 이전이어야 합니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">새 모의투자 세션</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          초기 자본금 (최소 {MIN_CAPITAL.toLocaleString()}원)
          <input
            type="number"
            min={MIN_CAPITAL}
            step={100000}
            required
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          시작일
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          종료일
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? '생성 중…' : '세션 시작'}
        </button>
      </form>
      <p className="mt-3 text-xs text-gray-500">
        시드 데이터 기간은 2020년 1분기(코로나 국면)다 — 이 범위 밖 날짜는 시세/뉴스가 없어 빈
        화면이 된다.
      </p>
    </div>
  )
}
