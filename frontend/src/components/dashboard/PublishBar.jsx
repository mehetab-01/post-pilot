import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle2 } from 'lucide-react'
import { PLATFORM_MAP } from './constants'

// ── Platform dot row ───────────────────────────────────────────────────────────
function PlatformDots({ platforms, publishResults }) {
  return (
    <div className="flex items-center gap-2">
      {platforms.map((p) => {
        const cfg    = PLATFORM_MAP[p]
        const result = publishResults?.[p]
        const posted = result?.success
        return (
          <div
            key={p}
            className="relative flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
            style={{
              background: `rgba(${cfg?.rgb},0.12)`,
              border: `1px solid rgba(${cfg?.rgb},0.25)`,
            }}
            title={cfg?.label ?? p}
          >
            {cfg?.Icon && <cfg.Icon size={13} style={{ color: cfg.color }} />}
            {posted && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 size={9} className="text-white" strokeWidth={3} />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function PublishBar({ generatedPosts, publishResults, onPublishAll, isPublishing }) {
  const platforms = Object.keys(generatedPosts).filter(
    (p) => generatedPosts[p] && !generatedPosts[p].isLoading,
  )

  if (platforms.length === 0) return null

  const postedCount = platforms.filter((p) => publishResults?.[p]?.success).length
  const allPosted   = postedCount === platforms.length && platforms.length > 0

  return (
    <AnimatePresence>
      <motion.div
        key="publish-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-[260px] right-0 z-30 px-8 pb-5 pt-3 pointer-events-none"
      >
        <div
          className="max-w-[960px] mx-auto flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-border pointer-events-auto"
          style={{
            background: 'rgba(24,24,27,0.92)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Dots */}
          <PlatformDots platforms={platforms} publishResults={publishResults} />

          {/* Label */}
          <div className="flex-1 min-w-0">
            {allPosted ? (
              <p className="text-sm text-green-400 font-medium">
                All posts published successfully!
              </p>
            ) : (
              <p className="text-sm text-text">
                <span className="font-semibold text-heading">{platforms.length}</span>
                {' '}post{platforms.length > 1 ? 's' : ''} ready to publish
                {postedCount > 0 && (
                  <span className="text-muted ml-1.5">
                    ({postedCount} done)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* CTA */}
          {!allPosted && (
            <button
              onClick={onPublishAll}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-900 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              }}
            >
              {isPublishing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-900/50 border-t-zinc-900 rounded-full animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Send size={14} />
                  Publish All
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
