import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

export function KeyInput({ name, label, placeholder, value, onChange, hasSavedValue }) {
  const [showVal, setShowVal] = useState(false)
  const [focused, setFocused] = useState(false)

  const showNote = hasSavedValue && value === '' && focused

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted select-none">
        {label}
      </label>

      <div className="relative">
        <input
          type={showVal ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            hasSavedValue
              ? '••••••••••• (saved — leave empty to keep)'
              : (placeholder ?? 'Paste your key here')
          }
          autoComplete="off"
          spellCheck={false}
          className={clsx(
            'w-full pr-10 pl-3.5 py-2.5 rounded-xl border text-sm font-mono',
            'bg-bg text-text placeholder:text-zinc-600 placeholder:font-sans placeholder:text-xs',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber/30 focus:border-amber',
            hasSavedValue && value === ''
              ? 'border-border'
              : value !== ''
                ? 'border-amber/50'
                : 'border-border hover:border-zinc-600',
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowVal((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-text transition-colors rounded"
        >
          {showVal ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {showNote && (
        <p className="text-[11px] text-amber/70 leading-snug">
          Enter a new value to update, or leave empty to keep the existing key.
        </p>
      )}
    </div>
  )
}
