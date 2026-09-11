/**
 * 국내 증권 앱 관례: 상승은 빨강, 하락은 파랑(미국식 초록/빨강과 반대).
 * 이 앱 전체에서 시세·수익률 색상을 이 기준으로 통일한다.
 */
export function priceChangeClass(rate: number): string {
  if (rate > 0) return 'text-rose-600'
  if (rate < 0) return 'text-blue-600'
  return 'text-gray-500'
}

export function formatSignedPercent(rate: number): string {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}
