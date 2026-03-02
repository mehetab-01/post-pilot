import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import gsap from 'gsap'
import { TONES, TONE_MAP, DEFAULT_TONE } from './constants'
import { TonePill } from './TonePill'
import { PlatformOptions } from './PlatformOptions'

export function PlatformCard({ platform, isSelected, selection, onToggle, onToneChange, onOptionChange }) {
  const cardRef = useRef(null)
  const { id, label, Icon, color, rgb, desc } = platform

  const selectedTone = selection?.tone ?? DEFAULT_TONE
  const options      = selection?.options ?? {}

  function handleToggle() {
    if (!isSelected) {
      // Pop animation on select
      gsap.fromTo(
        cardRef.current,
        { scale: 1 },
        { scale: 1.03, duration: 0.1, ease: 'power2.out',
          onComplete: () => gsap.to(cardRef.current, { scale: 1, duration: 0.15, ease: 'back.out(2)' }) }
      )
    }
    onToggle(id)
  }

  return (
    <div
      ref={cardRef}
      onClick={handleToggle}
      className={clsx(
        'rounded-2xl border cursor-pointer transition-colors duration-200 overflow-hidden',
        'focus-within:outline-none',
        isSelected ? 'bg-surface' : 'bg-surface hover:border-zinc-600',
      )}
      style={isSelected ? {
        borderColor: `rgba(${rgb},0.7)`,
        boxShadow: `0 0 0 1px rgba(${rgb},0.2), 0 0 24px rgba(${rgb},0.08)`,
      } : { borderColor: '#27272a' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        {/* Platform icon */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={isSelected
            ? { background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)` }
            : { background: '#27272a', border: '1px solid #3f3f46' }
          }
        >
          <Icon size={16} style={{ color: isSelected ? color : '#71717a' }} />
        </div>

        {/* Name + desc */}
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium leading-tight', isSelected ? 'text-heading' : 'text-text')}>
            {label}
          </p>
          <p className="text-xs text-muted">{desc}</p>
        </div>

        {/* Selection indicator */}
        <div
          className={clsx(
            'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-200',
            isSelected ? 'border-transparent' : 'border-zinc-600',
          )}
          style={isSelected ? { background: color } : {}}
        />
      </div>

      {/* Expanded options (when selected) */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 pb-4 pt-2 flex flex-col gap-4"
              style={{ borderTop: `1px solid rgba(${rgb},0.15)` }}
            >
              {/* Tone label */}
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">Tone</p>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((tone) => (
                    <TonePill
                      key={tone.id}
                      tone={tone}
                      isSelected={selectedTone === tone.id}
                      onClick={(toneId) => onToneChange(id, toneId)}
                    />
                  ))}
                </div>
              </div>

              {/* Platform-specific options */}
              <PlatformOptions
                platform={id}
                options={options}
                onChange={(newOpts) => onOptionChange(id, newOpts)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
