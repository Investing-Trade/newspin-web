import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { authApi } from '../api/auth'

type Step = 'email' | 'reset'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.sendPasswordResetCode(email)
      setInfo('인증코드를 이메일로 보냈습니다 (10분 이내 입력).')
      setStep('reset')
    } catch {
      setError('가입된 이메일이 아니거나 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.resetPassword({ email, code, newPassword })
      navigate('/sign-in')
    } catch {
      setError('인증코드가 올바르지 않거나 만료되었습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">비밀번호 재설정</h1>

      {step === 'email' && (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="가입한 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? '발송 중…' : '인증코드 발송'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={reset} className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">{email}</p>
          {info && <p className="text-sm text-green-600">{info}</p>}
          <input
            required
            placeholder="인증코드"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? '변경 중…' : '비밀번호 변경'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        <Link to="/sign-in" className="underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  )
}
