import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export function AdditionalInstructions({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors"
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={15} />
        </motion.span>
        {open ? 'Hide extra instructions' : 'Add specific instructions'}
        {value && !open && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber/15 text-amber text-xs font-medium border border-amber/20 ml-1">
            active
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder="e.g. Mention my GitHub @username, Include this link, Don't use hashtags on LinkedIn"
              className={clsx(
                'mt-3 w-full resize-none rounded-xl border border-border bg-surface',
                'px-3.5 py-3 text-sm text-text placeholder:text-muted',
                'focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber',
                'hover:border-zinc-600 transition-colors',
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
