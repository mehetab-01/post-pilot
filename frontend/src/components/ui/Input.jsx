import { useState } from 'react'
import { clsx } from 'clsx'
import { Eye, EyeOff } from 'lucide-react'

export function Input({
  label,
  error,
  hint,
  icon: Icon,
  type = 'text',
  className,
  containerClassName,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-text" htmlFor={props.id || props.name}>
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Icon size={16} />
          </span>
        )}

        <input
          type={resolvedType}
          className={clsx(
            'w-full h-10 bg-surface border rounded-xl text-text text-sm',
            'placeholder:text-muted',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber',
            error
              ? 'border-red-800 focus:ring-red-500/30 focus:border-red-600'
              : 'border-border hover:border-zinc-600',
            Icon ? 'pl-9' : 'pl-3',
            isPassword ? 'pr-10' : 'pr-3',
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
