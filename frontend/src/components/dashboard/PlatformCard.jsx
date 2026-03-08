import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import gsap from 'gsap'
import { Lock } from 'lucide-react'
import { TONES, TONE_MAP, DEFAULT_TONE } from './constants'
import { TonePill } from './TonePill'
import { PlatformOptions } from './PlatformOptions'

const LENGTH_OPTIONS = [
  { id: 'short',    label: 'S', title: 'Short'    },
  { id: 'medium',   label: 'M', title: 'Medium'   },
  { id: 'detailed', label: 'D', title: 'Detailed' },
]

export function PlatformCard({ platform, isSelected, selection, onToggle, onToneChange, onOptionChange, onLengthChange, isToneLocked, isLocked, requiredPlan }) {
  const cardRef = useRef(null)
  const { id, label, Icon, color, rgb, desc, comingSoon } = platform

  const selectedTone   = selection?.tone ?? DEFAULT_TONE
  const selectedLength = selection?.length ?? 'medium'
  const options        = selection?.options ?? {}

  function handleToggle() {
    if (comingSoon) return // Block interaction
    if (isLocked) {
      onToggle(id, true) // Signal that this is a locked platform click
      return
    }
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
        'rounded-2xl border transition-colors duration-200 overflow-hidden',
        'focus-within:outline-none',
        comingSoon
          ? 'bg-surface opacity-50 cursor-not-allowed'
          : isSelected ? 'bg-surface cursor-pointer' : 'bg-surface hover:border-zinc-600 cursor-pointer',
      )}
      style={isSelected && !comingSoon ? {
        borderColor: `rgba(${rgb},0.7)`,
        boxShadow: `0 0 0 1px rgba(${rgb},0.2), 0 0 24px rgba(${rgb},0.08)`,
      } : { borderColor: '#27272a' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        {/* Platform icon */}
        <div
          className="relative flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={isSelected
            ? { background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)` }
            : isLocked
              ? { background: '#1c1c1e', border: '1px solid #27272a' }
              : { background: '#27272a', border: '1px solid #3f3f46' }
          }
        >
          <Icon size={16} style={{ color: isLocked ? '#3f3f46' : (isSelected ? color : '#71717a') }} />
          {isLocked && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Lock size={8} className="text-zinc-500" />
            </div>
          )}
        </div>

        {/* Name + desc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={clsx('text-sm font-medium leading-tight', isLocked ? 'text-zinc-500' : isSelected ? 'text-heading' : 'text-text')}>
              {label}
            </p>
            {isLocked && requiredPlan && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                style={{
                  background: requiredPlan === 'Pro' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)',
                  color: requiredPlan === 'Pro' ? '#f59e0b' : '#a78bfa',
                  border: `1px solid ${requiredPlan === 'Pro' ? 'rgba(245,158,11,0.25)' : 'rgba(139,92,246,0.25)'}`,
                }}
              >
                {requiredPlan}
              </span>
            )}
          </div>
          <p className={clsx('text-xs', isLocked ? 'text-zinc-600' : 'text-muted')}>{desc}</p>
        </div>

        {/* Selection indicator or Coming Soon badge */}
        {comingSoon ? (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex-shrink-0"
            style={{ background: 'rgba(113,113,122,0.15)', color: '#71717a', border: '1px solid rgba(113,113,122,0.3)' }}>
            Soon
          </span>
        ) : (
          <div
            className={clsx(
              'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-200',
              isLocked ? 'border-zinc-700' : isSelected ? 'border-transparent' : 'border-zinc-600',
            )}
            style={isSelected && !isLocked ? { background: color } : {}}
          />
        )}
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
                      isLocked={isToneLocked?.(tone.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Length toggle */}
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-widest mb-2">Length</p>
                <div className="flex gap-1.5">
                  {LENGTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      title={opt.title}
                      onClick={() => onLengthChange(id, opt.id)}
                      className={clsx(
                        'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                        selectedLength === opt.id
                          ? 'border-transparent text-white'
                          : 'border-border text-muted hover:text-text hover:bg-zinc-800',
                      )}
                      style={selectedLength === opt.id ? { background: color, boxShadow: `0 0 8px rgba(${rgb},0.3)` } : {}}
                    >
                      {opt.title}
                    </button>
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
