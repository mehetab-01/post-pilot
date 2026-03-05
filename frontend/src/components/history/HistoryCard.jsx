import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ExternalLink, ChevronDown, MoreHorizontal, Copy, RefreshCw, Trash2, Check, Eye,
  Heart, Share2, MessageCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { PLATFORM_MAP, TONE_MAP } from '@/components/dashboard/constants'
import { getPost, deletePost } from '@/services/history'

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Three-dot actions menu ─────────────────────────────────────────────────────
function ActionsMenu({ onView, onReuse, onCopy, onDelete }) {
  const [open, setOpen]   = useState(false)
  const [pos, setPos]     = useState({ top: 0, right: 0 })
  const btnRef            = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (!btnRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  const items = [
    { icon: Eye,       label: 'View full post',     action: onView   },
    { icon: RefreshCw, label: 'Reuse as template',  action: onReuse  },
    { icon: Copy,      label: 'Copy content',        action: onCopy   },
    { icon: Trash2,    label: 'Delete',              action: onDelete, danger: true },
  ]

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-zinc-800 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>

      {/* Dropdown rendered via portal to escape overflow:hidden card */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: pos.top,
                right: pos.right,
                zIndex: 9999,
              }}
              className="w-44 rounded-xl border border-border bg-zinc-900 shadow-xl py-1 overflow-hidden"
            >
              {items.map(({ icon: Icon, label, action, danger }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { action(); setOpen(false) }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors',
                    danger
                      ? 'text-danger hover:bg-red-950/40'
                      : 'text-muted hover:text-text hover:bg-zinc-800',
                  )}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

// ── Expanded content renderer ──────────────────────────────────────────────────
function ExpandedContent({ fullData, onClose }) {
  const cfg      = PLATFORM_MAP[fullData.platform]
  const toneData = TONE_MAP[fullData.tone ?? 'professional']

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div className="px-4 pb-4 pt-2 border-t border-border flex flex-col gap-4">
        {/* Full content */}
        <div>
          <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Content</p>
          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
            {fullData.final_content ?? fullData.generated_content ?? ''}
          </p>
        </div>

        {/* Original context */}
        {fullData.context && (
          <div>
            <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Original context</p>
            <p className="text-xs text-muted leading-relaxed italic">{fullData.context}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          {toneData && (
            <span className="flex items-center gap-1.5">
              <toneData.Icon size={11} className="text-amber" />
              {toneData.label}
            </span>
          )}
          <span>Created {formatDate(fullData.created_at)}</span>
          {fullData.posted_at && (
            <span className="text-green-400">Published {formatDate(fullData.posted_at)}</span>
          )}
        </div>

        {/* Close expanded */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors self-start"
        >
          <ChevronDown className="rotate-180" size={12} />
          Collapse
        </button>
      </div>
    </motion.div>
  )
}

// ── Main card ──────────────────────────────────────────────────────────────────
export function HistoryCard({ item, onDeleted }) {
  const navigate            = useNavigate()
  const [expanded, setExp]  = useState(false)
  const [fullData, setFull] = useState(null)
  const [isLoading, setLd]  = useState(false)
  const [copied, setCopied] = useState(false)

  const cfg      = PLATFORM_MAP[item.platform]
  const toneData = TONE_MAP[item.tone ?? 'professional']

  async function handleView() {
    if (expanded) { setExp(false); return }
    if (!fullData) {
      setLd(true)
      try {
        const data = await getPost(item.id)
        setFull(data)
      } catch {
        toast.error('Could not load full post')
        return
      } finally {
        setLd(false)
      }
    }
    setExp(true)
  }

  function handleReuse() {
    navigate('/dashboard', { state: { context: item.context ?? '' } })
  }

  function handleCopy() {
    const text = fullData?.final_content ?? fullData?.generated_content ?? item.content ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleDelete() {
    try {
      await deletePost(item.id)
      toast.success('Post deleted')
      onDeleted?.(item.id)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Delete failed')
    }
  }

  const preview = (item.content ?? '').slice(0, 120) + ((item.content ?? '').length > 120 ? '…' : '')

  return (
    <motion.div
      layout
      className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-zinc-600 transition-colors duration-150 group"
    >
      {/* Card header row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Left: platform icon + colored accent bar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-1 self-stretch rounded-full min-h-[36px]"
            style={{ background: cfg?.color ?? '#8b5cf6' }}
          />
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
            style={{
              background: `rgba(${cfg?.rgb},0.12)`,
              border: `1px solid rgba(${cfg?.rgb},0.25)`,
            }}
          >
            {cfg?.Icon && <cfg.Icon size={14} style={{ color: cfg.color }} />}
          </div>
        </div>

        {/* Middle: content + meta */}
        <div className="flex-1 min-w-0">
          {/* Content preview */}
          <p className="text-sm text-text leading-relaxed line-clamp-2 mb-2">
            {preview || <span className="text-muted italic">No content preview</span>}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tone badge */}
            {toneData && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-muted border border-border bg-zinc-900">
                <toneData.Icon size={10} />
                {toneData.label}
              </span>
            )}

            {/* Date */}
            <span className="text-[11px] text-muted">{formatDate(item.created_at)}</span>

            {/* Status */}
            {item.posted ? (
              <span className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Published
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                Draft
              </span>
            )}

            {/* View post link */}
            {item.posted && item.post_url && (
              <a
                href={item.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[11px] text-amber hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={10} />
                View post
              </a>
            )}

            {/* Inline engagement metrics */}
            {item.metrics && (
              <span className="flex items-center gap-2.5 text-[11px] text-muted ml-1">
                <span className="flex items-center gap-0.5"><Heart size={10} className="text-pink-400" />{item.metrics.likes}</span>
                <span className="flex items-center gap-0.5"><Share2 size={10} className="text-blue-400" />{item.metrics.shares}</span>
                <span className="flex items-center gap-0.5"><MessageCircle size={10} className="text-emerald-400" />{item.metrics.comments}</span>
                {item.metrics.impressions > 0 && (
                  <span className="flex items-center gap-0.5"><Eye size={10} />{item.metrics.impressions}</span>
                )}
              </span>
            )}

            {/* Loading indicator for expand */}
            {isLoading && (
              <span className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Right: actions */}
        <ActionsMenu
          onView={handleView}
          onReuse={handleReuse}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && fullData && (
          <ExpandedContent fullData={fullData} onClose={() => setExp(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
