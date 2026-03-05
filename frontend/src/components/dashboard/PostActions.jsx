import { useState, useCallback } from 'react'
import {
  RefreshCw, Wand2, HeartHandshake, Pencil, Copy, Check, Send, Clipboard, Share2, LinkIcon, SlidersHorizontal, X, Lock,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { regeneratePost, enhancePost, humanizePost, postToPlatform } from '@/services/generate'
import { PLATFORM_MAP } from './constants'

// Platforms that need an OAuth/key connection to post directly
const NEEDS_CONNECTION = ['linkedin', 'reddit', 'twitter', 'bluesky', 'mastodon']

function ActionBtn({ icon: Icon, label, onClick, color, loading, title, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={title ?? label}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
        'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        'border border-transparent hover:border-border',
        color ?? 'text-muted hover:text-text hover:bg-surface-2',
        className,
      )}
    >
      {loading
        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        : <Icon size={13} />
      }
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export function PostActions({
  platform,
  postData,
  context,
  platformConfig,
  isConnected = null,
  mediaIds = [],
  isEditing,
  onToggleEdit,
  onUpdate,
  onPost,
  onRescoreNeeded,
  canDirectPost,
  onUpgrade,
}) {
  const [copied, setCopied]        = useState(false)
  const [loadingAction, setAction] = useState(null)
  const [posting, setPosting]      = useState(false)
  const [showRefine, setShowRefine] = useState(false)
  const [refineText, setRefineText] = useState('')
  const navigate = useNavigate()

  const cfg     = PLATFORM_MAP[platform]
  const tone    = platformConfig?.tone ?? 'professional'
  const options = platformConfig?.options ?? {}

  // isConnected===null means we don't know yet (loading); treat as connected to avoid flicker
  const notConnected = NEEDS_CONNECTION.includes(platform) && isConnected === false

  const run = useCallback(async (name, fn) => {
    setAction(name)
    try {
      await fn()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? `${name} failed`)
    } finally {
      setAction(null)
    }
  }, [])

  async function handleRegenerate() {
    run('regenerate', async () => {
      onUpdate({ isLoading: true })
      const result = await regeneratePost(platform, context, tone, options)
      onUpdate({ content: result.content, raw: result.raw, post_id: result.post_id, isEdited: false, isLoading: false })
      onRescoreNeeded?.(result.content)
      toast.success('Regenerated')
    })
  }

  async function handleEnhance() {
    run('enhance', async () => {
      onUpdate({ isLoading: true })
      const result = await enhancePost(platform, postData.content, tone)
      onUpdate({ content: result.enhanced_content, isEdited: true, isLoading: false })
      onRescoreNeeded?.(result.enhanced_content)
      toast.success('Enhanced')
    })
  }

  async function handleRefine() {
    if (!refineText.trim()) return
    run('refine', async () => {
      onUpdate({ isLoading: true })
      const result = await enhancePost(platform, postData.content, tone, refineText.trim())
      onUpdate({ content: result.enhanced_content, isEdited: true, isLoading: false })
      onRescoreNeeded?.(result.enhanced_content)
      setRefineText('')
      setShowRefine(false)
      toast.success('Refined')
    })
  }

  async function handleHumanize() {
    run('humanize', async () => {
      onUpdate({ isLoading: true })
      const result = await humanizePost(platform, postData.content, tone)
      onUpdate({ content: result.humanized_content, isEdited: true, isLoading: false })
      onRescoreNeeded?.(result.humanized_content)
      toast.success('Humanized')
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(postData.content).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handlePost() {
    if (platform === 'instagram') { handleCopy(); return }
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(postData.content)}`, '_blank', 'noopener')
      return
    }

    setPosting(true)
    try {
      const postOptions = platform === 'reddit'
        ? { subreddit: options.subreddit ?? 'r/general', title: postData.raw?.title ?? postData.content.slice(0, 100), ...options }
        : options

      const result = await postToPlatform(platform, postData.content, mediaIds, postOptions, postData.post_id)
      onUpdate({ posted: true, post_url: result.post_url })
      onPost({ platform, success: true, post_url: result.post_url })
      toast.success(`Posted to ${cfg?.label ?? platform}!`)
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Post failed')
    } finally {
      setPosting(false)
    }
  }

  // Post button label / icon per platform
  const postLabel = platform === 'instagram' ? 'Copy for Instagram'
                  : platform === 'whatsapp'  ? 'Share via WhatsApp'
                  : `Post to ${cfg?.label ?? platform}`
  const PostIcon  = platform === 'instagram' ? Clipboard
                  : platform === 'whatsapp'  ? Share2
                  : Send

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <ActionBtn icon={RefreshCw}      label="Regenerate" onClick={handleRegenerate} loading={loadingAction === 'regenerate'} />
        <ActionBtn icon={Wand2}          label="Enhance"    onClick={handleEnhance}    loading={loadingAction === 'enhance'}    />
        <ActionBtn icon={HeartHandshake} label="Humanize"   onClick={handleHumanize}   loading={loadingAction === 'humanize'}   />
        <ActionBtn
          icon={SlidersHorizontal}
          label="Refine"
          onClick={() => setShowRefine((v) => !v)}
          loading={loadingAction === 'refine'}
          className={showRefine ? 'text-amber border-amber/40 bg-amber/10 hover:border-amber/40' : ''}
        />
        <ActionBtn
          icon={isEditing ? Check : Pencil}
          label={isEditing ? 'Done' : 'Edit'}
          onClick={onToggleEdit}
          className={isEditing ? 'text-amber border-amber/40 bg-amber/10 hover:border-amber/40' : ''}
        />
        <ActionBtn
          icon={copied ? Check : Copy}
          label={copied ? 'Copied!' : 'Copy'}
          onClick={handleCopy}
          className={copied ? 'text-green-400' : ''}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Post button — or copy-draft fallback if not connected */}
        {!canDirectPost && NEEDS_CONNECTION.includes(platform) ? (
          <button
            type="button"
            onClick={() => onUpgrade?.('Direct Posting')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber/30 text-amber/70 hover:text-amber hover:bg-amber/10 transition-all"
          >
            <Lock size={13} />
            <span className="hidden sm:inline">Post</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber/80 ml-0.5">PRO</span>
          </button>
        ) : notConnected ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted hover:text-text hover:bg-surface-2 transition-all"
            >
              <Clipboard size={13} />
              <span className="hidden sm:inline">Copy Draft</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber/30 text-amber hover:bg-amber/10 transition-all"
            >
              <LinkIcon size={13} />
              <span className="hidden sm:inline">Connect {cfg?.label ?? platform}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePost}
            disabled={posting || !!postData.posted}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
              'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
              'border',
              postData.posted
                ? 'text-green-400 border-green-900 bg-green-950'
                : 'border-transparent hover:border-transparent',
            )}
            style={!postData.posted ? {
              color: '#09090b',
              background: cfg?.color ?? '#8b5cf6',
              boxShadow: `0 0 12px rgba(${cfg?.rgb ?? '139,92,246'},0.3)`,
            } : {}}
          >
            {posting
              ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              : <PostIcon size={13} />
            }
            <span className="hidden sm:inline">
              {postData.posted ? 'Posted' : postLabel}
            </span>
          </button>
        )}
      </div>

      {/* Refine panel */}
      <AnimatePresence>
        {showRefine && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex gap-2 pt-1">
              <textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={`Give specific instructions for this ${PLATFORM_MAP[platform]?.label ?? platform} post…`}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border bg-zinc-900 px-3 py-2 text-xs text-text placeholder:text-muted focus:outline-none focus:border-amber/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRefine()
                }}
              />
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={!refineText.trim() || loadingAction === 'refine'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber/90 transition-colors"
                >
                  {loadingAction === 'refine'
                    ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin inline-block" />
                    : 'Apply'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRefine(false); setRefineText('') }}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-text hover:bg-zinc-800 border border-border transition-colors"
                >
                  <X size={12} className="mx-auto" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
