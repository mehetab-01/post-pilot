import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, Star, X, ArrowRight } from 'lucide-react'

// ── Tier config ────────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  starter: {
    label: 'Starter',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.28)',
    Icon: Sparkles,
    upgradeText: 'Unlock with Starter',
  },
  pro: {
    label: 'Pro',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.28)',
    Icon: Star,
    upgradeText: 'Unlock with Pro',
  },
}

export function TemplatePreviewModal({ open, template, onClose, onUpgrade }) {
  if (!template) return null
  const tier = TIER_CONFIG[template.tier]
  if (!tier) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
            style={{
              background: '#111118',
              border: `1px solid ${tier.border}`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ background: tier.bg, borderBottom: `1px solid ${tier.border}` }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}28` }}
              >
                <tier.Icon size={14} style={{ color: tier.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest block mb-0.5"
                  style={{ color: tier.color }}
                >
                  {tier.label} Template
                </span>
                <p className="text-sm font-semibold text-heading truncate">{template.name}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-white/[0.06] transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Preview body */}
            <div className="p-5">
              {template.description && (
                <p className="text-xs text-muted leading-relaxed mb-4">{template.description}</p>
              )}

              <div className="flex items-center gap-1.5 mb-2.5">
                <Lock size={9} className="text-muted" />
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                  Sample output preview
                </span>
              </div>

              {template.preview_example ? (
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="px-4 pt-4 pb-2 text-xs leading-relaxed text-text/65 whitespace-pre-line">
                    {template.preview_example}
                  </p>
                  {/* Fade-out bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, transparent, rgba(17,17,24,0.95))',
                    }}
                  />
                  {/* Lock badge */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-1">
                    <Lock size={9} style={{ color: tier.color }} />
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: tier.color }}>
                      {tier.label}
                    </span>
                  </div>
                  {/* Bottom spacer for gradient */}
                  <div className="h-6" />
                </div>
              ) : (
                <div
                  className="rounded-xl px-4 py-3 text-xs text-muted italic border"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  Premium template — upgrade to see the full output.
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onUpgrade?.(template.tier)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{ background: tier.color, color: '#fff' }}
              >
                <tier.Icon size={13} />
                {tier.upgradeText}
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm text-muted border border-border hover:text-text hover:bg-white/[0.04] transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
