import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, XCircle, Loader2, Send, ExternalLink, Clock, Lock } from 'lucide-react'
import { PLATFORM_MAP } from './constants'

// ── Platform row ───────────────────────────────────────────────────────────────
function PlatformRow({ platform, postData, result }) {
  const cfg = PLATFORM_MAP[platform]

  // Determine row state
  let statusIcon = null
  let statusText = null

  if (result?.success) {
    statusIcon = <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
    statusText = (
      <span className="text-xs text-green-400 font-medium">
        {result.post_url ? (
          <a
            href={result.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            <ExternalLink size={11} />
            View post
          </a>
        ) : (
          'Published'
        )}
      </span>
    )
  } else if (result?.error) {
    statusIcon = <XCircle size={15} className="text-danger flex-shrink-0" />
    statusText = <span className="text-xs text-danger truncate max-w-[160px]">{result.error}</span>
  } else if (result?.loading) {
    statusIcon = <Loader2 size={15} className="text-muted animate-spin flex-shrink-0" />
    statusText = <span className="text-xs text-muted">Publishing…</span>
  } else {
    statusIcon = (
      <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" />
    )
    statusText = <span className="text-xs text-muted">Queued</span>
  }

  const preview = postData?.content?.slice(0, 80) + (postData?.content?.length > 80 ? '…' : '')

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {/* Platform icon */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 mt-0.5"
        style={{
          background: `rgba(${cfg?.rgb},0.12)`,
          border: `1px solid rgba(${cfg?.rgb},0.25)`,
        }}
      >
        {cfg?.Icon && <cfg.Icon size={14} style={{ color: cfg.color }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading leading-none mb-1">
          {cfg?.label ?? platform}
        </p>
        <p className="text-xs text-muted truncate">{preview}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        {statusIcon}
        {statusText}
      </div>
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export function PublishModal({
  isOpen,
  onClose,
  generatedPosts,
  publishResults,
  onPublishAll,
  onScheduleAll,
  isPublishing,
  canSchedule = false,
  onUpgrade,
}) {
  const [mode, setMode] = useState('now') // 'now' | 'schedule'
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const platforms = Object.keys(generatedPosts).filter(
    (p) => generatedPosts[p] && !generatedPosts[p].isLoading,
  )

  const postedCount  = platforms.filter((p) => publishResults?.[p]?.success).length
  const failCount    = platforms.filter((p) => publishResults?.[p]?.error).length
  const allDone      = postedCount + failCount === platforms.length && platforms.length > 0
  const hasPublished = postedCount > 0

  function handleScheduleToggle() {
    if (!canSchedule) {
      onUpgrade?.('Scheduled posting')
      return
    }
    setMode(mode === 'now' ? 'schedule' : 'now')
  }

  function handleConfirm() {
    if (mode === 'schedule') {
      if (!scheduleDate || !scheduleTime) return
      const localDt = new Date(`${scheduleDate}T${scheduleTime}`)
      const utcIso = localDt.toISOString()
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      onScheduleAll?.(utcIso, tz)
    } else {
      onPublishAll?.()
    }
  }

  // Min datetime = 5 min from now
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5)
  const minDate = now.toISOString().split('T')[0]
  const minTime = scheduleDate === minDate ? now.toTimeString().slice(0, 5) : '00:00'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <Motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <Motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-[480px] rounded-2xl border border-border overflow-hidden pointer-events-auto"
              style={{
                background: 'rgba(24,24,27,0.98)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber/10 border border-amber/20 flex-shrink-0">
                  <Send size={14} className="text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-heading">Publish Posts</h2>
                  <p className="text-xs text-muted mt-0.5">
                    {allDone
                      ? `${postedCount} published${failCount > 0 ? `, ${failCount} failed` : ''}`
                      : `${platforms.length} platform${platforms.length > 1 ? 's' : ''} selected`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-zinc-800 transition-colors flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Platform list */}
              <div className="px-5 py-1 max-h-[320px] overflow-y-auto">
                {platforms.map((platform) => (
                  <PlatformRow
                    key={platform}
                    platform={platform}
                    postData={generatedPosts[platform]}
                    result={publishResults?.[platform]}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-border flex flex-col gap-3">
                {/* Schedule toggle */}
                {!allDone && (
                  <button
                    type="button"
                    onClick={handleScheduleToggle}
                    className="flex items-center gap-2 text-xs text-muted hover:text-text transition-colors self-start"
                  >
                    {canSchedule ? (
                      <Clock size={13} />
                    ) : (
                      <Lock size={13} />
                    )}
                    {mode === 'schedule' ? 'Switch to Publish Now' : 'Schedule for later'}
                    {!canSchedule && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber/10 text-amber font-semibold">Pro</span>
                    )}
                  </button>
                )}

                {/* Datetime picker (when schedule mode) */}
                {mode === 'schedule' && !allDone && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      min={minDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="flex-1 h-9 bg-bg border border-border rounded-lg px-3 text-sm text-text focus:outline-none focus:border-amber/50"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      min={minTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-28 h-9 bg-bg border border-border rounded-lg px-3 text-sm text-text focus:outline-none focus:border-amber/50"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-text hover:border-zinc-600 transition-colors"
                  >
                    {allDone ? 'Close' : 'Cancel'}
                  </button>

                  {!allDone && (
                    <button
                      onClick={handleConfirm}
                      disabled={isPublishing || hasPublished || (mode === 'schedule' && (!scheduleDate || !scheduleTime))}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                      style={{
                        background: mode === 'schedule'
                          ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                          : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                      }}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {mode === 'schedule' ? 'Scheduling…' : 'Publishing…'}
                        </>
                      ) : (
                        <>
                          {mode === 'schedule' ? <Clock size={14} /> : <Send size={14} />}
                          {mode === 'schedule' ? 'Schedule Posts' : 'Confirm & Publish'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
