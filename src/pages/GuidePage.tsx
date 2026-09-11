import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const STEPS = [
  {
    title: '뉴스 학습으로 판단 감각 익히기',
    body: '상단 "뉴스 학습"에서 실제 뉴스를 읽고 호재/악재를 판단해 보세요. 판단 이유를 적고 제출하면 AI가 채점하고 피드백을 줍니다. 여러 번 반복할수록 판단 감각이 쌓입니다.',
  },
  {
    title: '모의투자 세션 만들기',
    body: '"내 세션" → "새 세션"에서 초기 자본금과 기간을 정해 시작합니다. 기본값은 2020년 1분기(코로나 국면) — 이 기간 시세/뉴스만 준비돼 있습니다.',
  },
  {
    title: '뉴스 보고 매매하기',
    body: '세션 화면에서 "오늘의 뉴스"를 펼쳐 보고, 종목 목록에서 종목을 선택해 수량을 정한 뒤 매수/매도합니다. 체결가는 항상 그날 종가로 확정됩니다.',
  },
  {
    title: '다음 날로 진행하며 반복',
    body: '"다음 날 진행"을 누르면 날짜가 넘어가고 시세·뉴스가 바뀝니다. 포트폴리오와 거래 내역에서 지금까지의 결과를 확인할 수 있습니다.',
  },
  {
    title: '세션 종료 후 AI 리포트 확인',
    body: '더 진행하지 않으려면 "세션 종료"를 누르세요. 잠시 후(자동으로 갱신됨) 투자 성과와 판단 정확도를 종합한 AI 리포트가 생성됩니다.',
  },
]

export function GuidePage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link to={user ? '/sessions' : '/sign-in'} className="text-sm text-gray-500 underline">
        ← {user ? '내 세션으로 돌아가기' : '로그인으로 돌아가기'}
      </Link>
      <h1 className="mt-4 mb-2 text-xl font-semibold">NewsPin 사용법</h1>
      <p className="mb-6 text-sm text-gray-600">
        뉴스를 읽고 판단하는 연습과, 그 판단을 모의투자로 확인해보는 두 기능으로 구성돼 있습니다.
      </p>
      <ol className="flex flex-col gap-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-gray-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {!user && (
        <div className="mt-8 flex gap-4 text-sm">
          <Link to="/sign-up" className="rounded bg-gray-900 px-3 py-2 font-medium text-white">
            회원가입하고 시작하기
          </Link>
          <Link to="/sign-in" className="rounded border border-gray-300 px-3 py-2">
            로그인
          </Link>
        </div>
      )}
    </div>
  )
}
