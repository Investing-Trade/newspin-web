import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { authApi } from '../api/auth'

/**
 * BE `UserService.signUp` 은 실제로는 이메일 인증 여부를 검사하지 않는다(email/password 만 확인,
 * 중복 이메일만 거부) — `/user/email/send-verification`·`/verify` 엔드포인트는 있지만 가입 조건은
 * 아니다. 그래서 여기서도 이메일 인증 단계는 넣지 않았다. BE 가 나중에 강제하게 되면 그때 추가.
 */
export function SignUpPage() {
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
      await authApi.signUp({ email, password })
      navigate('/sign-in')
    } catch {
      setError('회원가입에 실패했습니다. 이미 가입된 이메일일 수 있습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">회원가입</h1>
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
          minLength={8}
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
          {isSubmitting ? '가입 중…' : '가입하기'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link to="/sign-in" className="underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
