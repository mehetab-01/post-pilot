import { useRef, useEffect, useState } from 'react'
import { Rocket, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import gsap from 'gsap'

const MESSAGES = [
  'Crafting your content…',
  'Optimising for each platform…',
  'Almost there…',
]

export function GenerateButton({ isLoading, isDisabled, onClick, limitReached, onUpgrade }) {
  const btnRef       = useRef(null)
  const progressRef  = useRef(null)
  const [msgIdx, setMsgIdx]     = useState(0)
  const [progress, setProgress] = useState(0)

  // Cycle messages + fake progress while loading
  useEffect(() => {
    if (!isLoading) { setMsgIdx(0); setProgress(0); return }

    const msgTimer = setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
      2200
    )
    const progTimer = setInterval(
      () => setProgress((p) => (p < 86 ? p + 2 : p)),
      180
    )
    return () => { clearInterval(msgTimer); clearInterval(progTimer) }
  }, [isLoading])

  // Animate progress bar width with GSAP
  useEffect(() => {
    if (!progressRef.current) return
    gsap.to(progressRef.current, {
      width: isLoading ? `${progress}%` : '0%',
      duration: 0.3,
      ease: 'power2.out',
    })
  }, [progress, isLoading])

  function handleClick(e) {
    if (limitReached) {
      onUpgrade?.()
      return
    }
    if (isDisabled || isLoading) return

    // GSAP press + ripple
    gsap.to(btnRef.current, {
      scale: 0.97,
      duration: 0.08,
      ease: 'power2.in',
      onComplete: () =>
        gsap.to(btnRef.current, { scale: 1, duration: 0.2, ease: 'back.out(2.5)' }),
    })

    onClick(e)
  }

  const disabled = (isDisabled || isLoading) && !limitReached

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        'relative w-full h-14 rounded-2xl overflow-hidden',
        'font-heading font-semibold text-base',
        'transition-all duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        limitReached
          ? 'bg-zinc-800 text-muted cursor-pointer border border-amber/30 hover:border-amber/50'
          : disabled
          ? 'bg-zinc-800 text-muted cursor-not-allowed border border-border'
          : 'text-white cursor-pointer hover:shadow-[0_0_32px_rgba(139,92,246,0.45)]',
      )}
      style={disabled || limitReached ? {} : {
        background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #7c3aed 100%)',
        backgroundSize: '200% 100%',
      }}
    >
      {/* Progress bar (inside button, behind content) */}
      {isLoading && (
        <div
          ref={progressRef}
          className="absolute inset-y-0 left-0 bg-white/15 rounded-2xl transition-none"
          style={{ width: '0%' }}
        />
      )}

      {/* Label */}
      <span className="relative flex items-center justify-center gap-2.5">
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>{MESSAGES[msgIdx]}</span>
          </>
        ) : limitReached ? (
          <>
            <Lock size={16} className="text-amber" />
            <span className="text-amber">Limit reached — Upgrade to continue</span>
          </>
        ) : (
          <>
            <Rocket size={18} />
            <span>{disabled && !isLoading ? 'Add context & select platforms' : 'Generate Posts'}</span>
          </>
        )}
      </span>
    </button>
  )
}
