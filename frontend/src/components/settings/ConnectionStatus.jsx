import { clsx } from 'clsx'

const STATUS_MAP = {
  connected: { dot: 'bg-green-500',  label: 'Connected',      text: 'text-green-400'  },
  saved:     { dot: 'bg-amber',      label: 'Keys saved',     text: 'text-amber'      },
  none:      { dot: 'bg-zinc-600',   label: 'Not connected',  text: 'text-muted'      },
  clipboard: { dot: 'bg-blue-500',   label: 'Clipboard mode', text: 'text-blue-400'   },
  share:     { dot: 'bg-zinc-500',   label: 'Share mode',     text: 'text-muted'      },
}

export function ConnectionStatus({ status, size = 'sm' }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.none

  return (
    <span className={clsx('flex items-center gap-1.5 font-medium', cfg.text, size === 'sm' ? 'text-xs' : 'text-sm')}>
      <span className={clsx('rounded-full flex-shrink-0', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {cfg.label}
    </span>
  )
}
