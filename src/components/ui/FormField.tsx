import { useId, type InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

/**
 * placeholder만으로는 스크린리더/자동완성이 필드를 제대로 인식하지 못한다 —
 * `<label htmlFor>` 을 항상 붙인 입력 필드. `useId` 로 페이지 안에서 중복 없는 id 생성.
 */
export function FormField({ label, className, ...inputProps }: FormFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-2 focus:outline-offset-1 focus:outline-gray-400 ${className ?? ''}`}
        {...inputProps}
      />
    </div>
  )
}
