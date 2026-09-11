import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { FormField } from '../components/ui/FormField'
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
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 px-4 sm:px-6">
      <h1 className="text-xl font-semibold">NewsPin 로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <FormField
          label="이메일"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-500">
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
