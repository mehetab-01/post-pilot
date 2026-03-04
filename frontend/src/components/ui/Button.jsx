import { clsx } from 'clsx'
import { LoadingSpinner } from './LoadingSpinner'

const variants = {
  primary:
    'bg-amber text-white font-semibold hover:bg-amber-light active:scale-[0.97] shadow-[0_0_0_0_rgba(139,92,246,0)] hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-2 hover:border-border active:scale-[0.97]',
  ghost:
    'text-muted hover:text-text hover:bg-surface active:scale-[0.97]',
  danger:
    'bg-transparent text-danger border border-red-900 hover:bg-red-950 hover:border-red-700 active:scale-[0.97]',
  outline:
    'bg-transparent text-amber border border-amber hover:bg-amber-glow active:scale-[0.97]',
}

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}) {
  const isDisabled = disabled || isLoading

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={16} color={variant === 'primary' ? '#ffffff' : '#8b5cf6'} />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={16} />
      )}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={16} />}
    </button>
  )
}
