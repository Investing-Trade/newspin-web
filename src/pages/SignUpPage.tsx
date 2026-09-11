import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { authApi } from '../api/auth'
import { getErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { FormField } from '../components/ui/FormField'
import { IntroPanel } from '../components/IntroPanel'

type Step = 'email' | 'code' | 'password'

/**
 * BE `UserService.signUp` 은 실제로는 이메일 인증 여부를 검사하지 않는다(email/password 만
 * 확인, 중복 이메일만 거부) — 그래도 `/user/email/send-verification`·`/verify` 가 존재하는
 * 이상 정상적인 가입 경로로 노출한다. FE 가 "인증 완료 전엔 다음 단계로 못 넘어가게" 막는
 * 게이팅을 자체적으로 건다(BE 가 강제하지 않는 만큼, 나중에 이 단계를 건너뛰는 예외 경로가
 * 필요해지면 여기만 손보면 된다).
 */
export function SignUpPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.sendVerificationEmail(email)
      setInfo('인증코드를 이메일로 보냈습니다 (10분 이내 입력).')
      setStep('code')
    } catch (err) {
      setError(getErrorMessage(err, '이미 가입된 이메일이거나 발송에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await authApi.verifyEmail(email, code)
      if (result.verified) {
        setStep('password')
        setInfo(null)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(getErrorMessage(err, '인증 확인에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.signUp({ email, password })
      navigate('/sign-in')
    } catch (err) {
      setError(getErrorMessage(err, '회원가입에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-4xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <div className="order-2 lg:order-1">
        <IntroPanel />
      </div>
      <div className="order-1 flex w-full max-w-sm flex-col gap-4 lg:order-2">
        <h2 className="text-xl font-semibold">회원가입</h2>

        {step === 'email' && (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <FormField
              label="이메일"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '발송 중…' : '인증코드 발송'}
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">{email}</p>
            {info && (
              <p role="status" className="text-sm text-green-600">
                {info}
              </p>
            )}
            <FormField label="인증코드" required value={code} onChange={(e) => setCode(e.target.value)} />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '확인 중…' : '인증 확인'}
            </Button>
            <button type="button" onClick={() => setStep('email')} className="text-xs text-gray-400 underline">
              이메일 다시 입력
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={submitSignUp} className="flex flex-col gap-3">
            <p role="status" className="text-sm text-green-600">
              이메일 인증 완료 — {email}
            </p>
            <FormField
              label="비밀번호"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '가입 중…' : '가입하기'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/sign-in" className="underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
