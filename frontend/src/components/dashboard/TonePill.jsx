import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export function TonePill({ tone, isSelected, onClick, isLocked }) {
  const [hovered, setHovered] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const pillRef = useRef(null)
  const { Icon, label, description, example } = tone

  function handleMouseEnter() {
    if (isLocked) return
    if (pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect()
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 })
    }
    setHovered(true)
  }

  return (
    <div
      ref={pillRef}
      className="relative flex-shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => onClick(tone.id)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
          'transition-all duration-150 border whitespace-nowrap',
          isSelected && !isLocked
            ? 'bg-amber text-white border-amber shadow-[0_0_10px_rgba(139,92,246,0.3)]'
            : 'bg-surface text-muted border-border hover:text-text hover:border-zinc-600',
        )}
      >
        <Icon size={13} />
        {label}
        {isLocked && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber/80 ml-0.5">PRO</span>
        )}
      </button>

      {/* Tooltip — rendered via portal to escape overflow:hidden parents */}
      {createPortal(
        <AnimatePresence>
          {hovered && (
            <div
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                transform: 'translateX(-50%) translateY(-100%)',
                zIndex: 9999,
                pointerEvents: 'none',
                width: '14rem',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl shadow-black/60">
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 bg-zinc-900 border-r border-b border-zinc-700 rotate-45" />
                  <p className="text-xs font-medium text-heading mb-1">{label}</p>
                  <p className="text-xs text-muted mb-2">{description}</p>
                  <p className="text-xs text-zinc-400 italic leading-relaxed">&ldquo;{example}&rdquo;</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
