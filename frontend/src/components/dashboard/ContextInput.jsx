import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { clsx } from 'clsx'

const PLACEHOLDERS = [
  "I just got promoted to Senior Developer at Google…",
  "Here's a tutorial on building a REST API in 10 minutes…",
  "Sharing my 6-month coding journey and lessons learned…",
  "We just launched our startup and got into Y Combinator…",
]

const MAX_CHARS = 2000

export function ContextInput({ value, onChange }) {
  const textareaRef      = useRef(null)
  const placeholderRef   = useRef(null)
  const [phIndex, setPhIndex] = useState(0)

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(160, el.scrollHeight) + 'px'
  }, [value])

  // Cycle placeholder every 3 s with GSAP fade
  useEffect(() => {
    if (value) return                       // stop cycling once user types
    const el = placeholderRef.current
    if (!el) return

    const interval = setInterval(() => {
      gsap.to(el, {
        opacity: 0, y: -6, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
          setPhIndex((i) => (i + 1) % PLACEHOLDERS.length)
          gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
        },
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [value])

  const pct    = value.length / MAX_CHARS
  const countColor =
    pct > 0.95 ? 'text-danger' :
    pct > 0.80 ? 'text-amber'  : 'text-muted'

  return (
    <div className="relative">
      {/* Floating placeholder (only when empty) */}
      {!value && (
        <span
          ref={placeholderRef}
          className="absolute left-4 top-4 text-muted text-sm pointer-events-none select-none"
          aria-hidden="true"
        >
          {PLACEHOLDERS[phIndex]}
        </span>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) onChange(e.target.value)
        }}
        rows={5}
        className={clsx(
          'w-full resize-none rounded-2xl border bg-surface px-4 py-4 text-sm text-text',
          'transition-all duration-200 outline-none',
          'focus:ring-2 focus:ring-amber/40 focus:border-amber',
          'hover:border-zinc-600',
          'border-border placeholder:text-transparent',
          'min-h-[160px]',
        )}
        style={{ overflow: 'hidden' }}
        spellCheck
      />

      {/* Char count */}
      <span className={clsx('absolute bottom-3 right-4 text-xs font-mono select-none', countColor)}>
        {value.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
      </span>
    </div>
  )
}
