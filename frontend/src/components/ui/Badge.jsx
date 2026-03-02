import { clsx } from 'clsx'

const variants = {
  default:   'bg-zinc-800 text-zinc-300 border-border',
  amber:     'bg-amber-glow text-amber border border-amber/30',
  success:   'bg-green-950 text-green-400 border border-green-900',
  danger:    'bg-red-950 text-danger border border-red-900',
  twitter:   'bg-zinc-800 text-twitter border border-zinc-700',
  linkedin:  'bg-blue-950 text-linkedin border border-blue-900',
  reddit:    'bg-orange-950 text-reddit border border-orange-900',
  instagram: 'bg-pink-950 text-instagram border border-pink-900',
  whatsapp:  'bg-green-950 text-whatsapp border border-green-900',
}

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
