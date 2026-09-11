import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'buy' | 'sell'
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-700',
  secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  // 국내 증권 앱 관례: 상승/매수=빨강, 하락/매도=파랑 (미국식 초록/빨강 반대)
  buy: 'bg-rose-600 text-white hover:bg-rose-700',
  sell: 'bg-blue-600 text-white hover:bg-blue-700',
}

/** 포커스 링을 포함한 공통 버튼 — 어디서든 키보드 탐색 시 포커스가 보이도록. */
export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 ${VARIANT_CLASS[variant]} ${className ?? ''}`}
      {...props}
    />
  )
}
