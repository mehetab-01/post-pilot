import { clsx } from 'clsx'

export function Card({ children, className, hover = false, padding = true, ...props }) {
  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-2xl',
        'transition-all duration-200',
        hover && [
          'hover:border-zinc-600',
          'hover:shadow-[0_0_0_1px_rgba(39,39,42,0.8),0_8px_32px_rgba(0,0,0,0.4)]',
          'cursor-pointer',
        ],
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={clsx('flex items-center justify-between mb-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={clsx('font-heading text-lg font-semibold text-heading', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={clsx('text-sm text-muted mt-1', className)} {...props}>
      {children}
    </p>
  )
}
