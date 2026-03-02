import { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function SetupGuide({ steps }) {
  const [open, setOpen] = useState(false)

  if (!steps?.length) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown size={13} />
        </motion.span>
        {open ? 'Hide setup guide' : 'How to get these keys'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <ol className="mt-4 flex flex-col gap-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-muted">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-[10px] font-mono text-heading mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">
                    {step.text}
                    {step.link && (
                      <a
                        href={step.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 ml-1 text-amber hover:underline"
                      >
                        {step.link.text}
                        <ExternalLink size={10} className="ml-0.5" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
