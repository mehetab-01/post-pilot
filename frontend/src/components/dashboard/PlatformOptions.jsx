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
      <div className="flex flex-col gap-3">
        <Toggle
          label="Thread mode"
          checked={!!options.thread}
          onChange={(v) => set('thread', v)}
        />
        {options.thread && (
          <div>
            <label className="text-xs font-medium text-muted block mb-1.5">
              Number of tweets ({options.thread_count || 3})
            </label>
            <input
              type="range"
              min={2}
              max={10}
              value={options.thread_count || 3}
              onChange={(e) => set('thread_count', parseInt(e.target.value, 10))}
              className="w-full accent-amber"
            />
            <div className="flex justify-between text-[10px] text-muted mt-0.5">
              <span>2</span>
              <span>10</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (platform === 'linkedin') {
    return (
      <div className="flex flex-col gap-3">
        <Toggle
          label="Include call-to-action"
          checked={options.cta !== false}
          onChange={(v) => set('cta', v)}
        />
        {options.cta !== false && (
          <>
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">CTA text</label>
              <input
                type="text"
                value={options.cta_text || ''}
                onChange={(e) => set('cta_text', e.target.value)}
                placeholder="e.g. Sign up for our free trial"
                className={clsx(
                  'w-full h-9 bg-bg border border-border rounded-lg px-3 text-sm text-text',
                  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber',
                  'hover:border-zinc-600 transition-colors',
                )}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">CTA link</label>
              <input
                type="url"
                value={options.cta_link || ''}
                onChange={(e) => set('cta_link', e.target.value)}
                placeholder="https://example.com/signup"
                className={clsx(
                  'w-full h-9 bg-bg border border-border rounded-lg px-3 text-sm text-text',
                  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber',
                  'hover:border-zinc-600 transition-colors',
                )}
              />
            </div>
          </>
        )}
      </div>
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

  if (platform === 'mastodon') {
    return (
      <div>
        <label className="text-xs font-medium text-muted block mb-1.5">Visibility</label>
        <select
          value={options.visibility || 'public'}
          onChange={(e) => set('visibility', e.target.value)}
          className={clsx(
            'w-full h-9 bg-bg border border-border rounded-lg px-3 text-sm text-text',
            'focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber',
            'hover:border-zinc-600 transition-colors',
          )}
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Followers only</option>
        </select>
      </div>
    )
  }

  // WhatsApp — no extra options
  return null
}
