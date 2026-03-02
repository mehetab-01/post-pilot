import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export function TonePill({ tone, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false)
  const { Icon, label, description, example } = tone

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => onClick(tone.id)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
          'transition-all duration-150 border whitespace-nowrap',
          isSelected
            ? 'bg-amber text-zinc-900 border-amber shadow-[0_0_10px_rgba(245,158,11,0.25)]'
            : 'bg-surface text-muted border-border hover:text-text hover:border-zinc-600',
        )}
      >
        <Icon size={13} />
        {label}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56"
            style={{ pointerEvents: 'none' }}
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl shadow-black/60">
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 bg-zinc-900 border-r border-b border-zinc-700 rotate-45" />

              <p className="text-xs font-medium text-heading mb-1">{label}</p>
              <p className="text-xs text-muted mb-2">{description}</p>
              <p className="text-xs text-zinc-400 italic leading-relaxed">&ldquo;{example}&rdquo;</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
