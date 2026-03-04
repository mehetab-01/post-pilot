import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle, AlertCircle, Lightbulb, X, HeartHandshake, Lock } from 'lucide-react'
import { clsx } from 'clsx'

// ── Score config ───────────────────────────────────────────────────────────────
function getScoreConfig(score) {
  if (score <= 30) return {
    label: 'Human',
    Icon: ShieldCheck,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.25)',
    barColor: '#4ade80',
  }
  if (score <= 60) return {
    label: 'Mixed',
    Icon: AlertTriangle,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.25)',
    barColor: '#fbbf24',
  }
  return {
    label: 'AI Detected',
    Icon: AlertCircle,
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.25)',
    barColor: '#f87171',
  }
}

// ── Arc SVG progress ───────────────────────────────────────────────────────────
function ScoreArc({ score, color, size = 20 }) {
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const arcLen = circ * 0.75
  const filled = arcLen * (score / 100)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"
        strokeDasharray={`${arcLen} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  )
}

// ── Popover ────────────────────────────────────────────────────────────────────
function ScorePopover({ score, flags, tips, onClose, onHumanize, humanizing, anchorRef }) {
  const cfg = getScoreConfig(score)
  const [pos, setPos] = useState({ top: 0, left: 0, placement: 'bottom' })

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const placement = spaceBelow < 280 ? 'top' : 'bottom'
    setPos({
      top: placement === 'bottom' ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
      placement,
    })
  }, [anchorRef])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: pos.placement === 'bottom' ? pos.top : undefined,
        bottom: pos.placement === 'top' ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '288px',
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: pos.placement === 'bottom' ? -6 : 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: pos.placement === 'bottom' ? -4 : 4, scale: 0.97 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="rounded-xl shadow-xl shadow-black/50 overflow-hidden"
        style={{
          background: '#111118',
          border: `1px solid ${cfg.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
        >
          <cfg.Icon size={13} style={{ color: cfg.color, flexShrink: 0 }} />
          <span className="text-xs font-semibold flex-1" style={{ color: cfg.color }}>
            AI Score: {score}/100 — {cfg.label}
          </span>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={12} />
          </button>
        </div>

        {/* Score bar */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: cfg.barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
              Detected patterns
            </p>
            <div className="flex flex-col gap-1.5">
              {flags.map((flag, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-text font-medium">
                    &ldquo;{flag.phrase}&rdquo;
                  </span>
                  <span className="text-[10px] text-muted leading-relaxed">
                    {flag.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <div className="px-3 pt-1.5 pb-2">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
              Tips
            </p>
            <div className="flex flex-col gap-1">
              {tips.map((t, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Lightbulb size={10} className="text-amber mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-muted leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Humanize button */}
        <div className="px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={() => { onHumanize(); onClose() }}
            disabled={humanizing}
            className={clsx(
              'w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-xs font-semibold transition-all duration-150',
              'bg-amber/10 border border-amber/25 text-amber hover:bg-amber/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {humanizing
              ? <span className="w-3 h-3 border border-amber border-t-transparent rounded-full animate-spin" />
              : <HeartHandshake size={12} />
            }
            Auto-Humanize this post
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

// ── Main badge ─────────────────────────────────────────────────────────────────
export function HumanizeScore({ scoreData, loading, onHumanize, locked, onUpgrade }) {
  const [open, setOpen] = useState(false)
  const [humanizing, setHumanizing] = useState(false)
  const btnRef = useRef(null)

  // Close popover when score updates
  useEffect(() => { setOpen(false) }, [scoreData?.score])

  const handleHumanize = useCallback(async () => {
    if (!onHumanize) return
    setHumanizing(true)
    try {
      await onHumanize()
    } finally {
      setHumanizing(false)
    }
  }, [onHumanize])

  // Show locked state for free users
  if (locked) {
    return (
      <button
        type="button"
        onClick={() => onUpgrade?.()}
        title="Upgrade to unlock AI Humanize Score"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-surface-2 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <Lock size={11} className="text-amber" />
        <span className="text-[10px] text-muted hidden sm:inline">Human</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber/80">PRO</span>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-surface-2">
        <span className="w-3 h-3 border border-muted/40 border-t-muted rounded-full animate-spin" />
        <span className="text-[10px] text-muted hidden sm:inline">Scoring…</span>
      </div>
    )
  }

  if (!scoreData) return null

  const cfg = getScoreConfig(scoreData.score)
  const { Icon } = cfg

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`AI Score: ${scoreData.score}/100 — click for details`}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-150 hover:brightness-110',
          open ? 'brightness-110' : '',
        )}
        style={{ background: cfg.bg, borderColor: cfg.border }}
      >
        {/* Arc */}
        <div className="relative flex-shrink-0" style={{ width: 20, height: 20 }}>
          <ScoreArc score={scoreData.score} color={cfg.color} size={20} />
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: 7, fontWeight: 700, color: cfg.color }}
          >
            {scoreData.score}
          </span>
        </div>
        <Icon size={11} style={{ color: cfg.color }} />
        <span className="text-[10px] font-semibold hidden sm:inline" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <ScorePopover
            score={scoreData.score}
            flags={scoreData.flags ?? []}
            tips={scoreData.tips ?? []}
            onClose={() => setOpen(false)}
            onHumanize={handleHumanize}
            humanizing={humanizing}
            anchorRef={btnRef}
          />
        )}
      </AnimatePresence>
    </>
  )
}
