import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/sessions')
    } catch {
      setError('로그인에 실패했습니다. 이메일/비밀번호를 확인해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">NewsPin 로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <div className="flex justify-between text-sm text-gray-500">
        <Link to="/sign-up" className="underline">
          회원가입
        </Link>
        <Link to="/forgot-password" className="underline">
          비밀번호를 잊으셨나요?
        </Link>
      </div>
    </div>
  )
}
