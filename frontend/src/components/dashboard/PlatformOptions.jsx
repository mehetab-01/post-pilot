import { clsx } from 'clsx'

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-amber' : 'bg-zinc-700',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </div>
      <span className="text-sm text-text">{label}</span>
    </label>
  )
}

export function PlatformOptions({ platform, options, onChange }) {
  function set(key, val) {
    onChange({ ...options, [key]: val })
  }

  if (platform === 'twitter') {
    return (
      <Toggle
        label="Thread mode"
        checked={!!options.thread}
        onChange={(v) => set('thread', v)}
      />
    )
  }

  if (platform === 'linkedin') {
    return (
      <Toggle
        label="Include call-to-action"
        checked={options.cta !== false}
        onChange={(v) => set('cta', v)}
      />
    )
  }

  if (platform === 'instagram') {
    return (
      <Toggle
        label="Include hashtag block"
        checked={options.hashtags !== false}
        onChange={(v) => set('hashtags', v)}
      />
    )
  }

  if (platform === 'reddit') {
    return (
      <div>
        <label className="text-xs font-medium text-muted block mb-1.5">Target subreddit</label>
        <input
          type="text"
          value={options.subreddit || ''}
          onChange={(e) => set('subreddit', e.target.value)}
          placeholder="e.g. r/programming"
          className={clsx(
            'w-full h-9 bg-bg border border-border rounded-lg px-3 text-sm text-text',
            'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber',
            'hover:border-zinc-600 transition-colors',
          )}
        />
      </div>
    )
  }

  // WhatsApp — no extra options
  return null
}
