/** 화면 전체에서 통일된 로딩 표시. `role="status"`로 스크린리더가 인지할 수 있게. */
export function LoadingState({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="py-4 text-sm text-gray-500">
      {label}
    </p>
  )
}
