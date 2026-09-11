import type { ReactNode } from 'react'

/** 화면 전체에서 통일된 에러 표시. `role="alert"`로 스크린리더가 즉시 읽게 한다. */
export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-600">
      {children}
    </p>
  )
}
