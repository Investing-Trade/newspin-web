import { Link } from 'react-router-dom'

const FEATURES = [
  {
    title: '뉴스로 판단력 연습',
    body: '실제 있었던 뉴스를 읽고 호재/악재를 판단하면, AI가 채점하고 피드백을 줍니다.',
  },
  {
    title: '실제 시세로 모의투자',
    body: '2020년 실제 종목 시세로 매수/매도하며, 뉴스에 어떻게 반응하는지 직접 확인합니다.',
  },
  {
    title: '세션 종료 후 AI 리포트',
    body: '투자 성과와 판단 정확도를 종합해 AI가 개선점을 짚어줍니다.',
  },
]

/** 로그인/가입 화면에 함께 보이는 서비스 소개. 폼 옆(데스크톱)/위(모바일)에 배치. */
export function IntroPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">NewsPin</h1>
        <p className="mt-1 text-gray-600">뉴스를 읽고 판단하는 연습, 그 판단을 모의투자로 확인해보세요.</p>
      </div>
      <ul className="flex flex-col gap-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-rose-600">
              ●
            </span>
            <div>
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-gray-600">{f.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/guide" className="text-sm underline">
        사용법 알아보기 →
      </Link>
    </div>
  )
}
