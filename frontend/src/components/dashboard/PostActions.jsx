import { useState, useCallback } from 'react'
import {
  RefreshCw, Wand2, HeartHandshake, Pencil, Copy, Check, Send, Clipboard, Share2,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { regeneratePost, enhancePost, humanizePost, postToPlatform } from '@/services/generate'
import { PLATFORM_MAP } from './constants'

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
  isEditing,
  onToggleEdit,
  onUpdate,
  onPost,
}) {
  const [copied, setCopied]             = useState(false)
  const [loadingAction, setAction]      = useState(null)
  const [posting, setPosting]           = useState(false)

  const cfg    = PLATFORM_MAP[platform]
  const tone   = platformConfig?.tone ?? 'professional'
  const options= platformConfig?.options ?? {}

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
      toast.success('Regenerated')
    })
  }

  async function handleEnhance() {
    run('enhance', async () => {
      onUpdate({ isLoading: true })
      const result = await enhancePost(platform, postData.content, tone)
      onUpdate({ content: result.enhanced_content, isEdited: true, isLoading: false })
      toast.success('Enhanced')
    })
  }

  async function handleHumanize() {
    run('humanize', async () => {
      onUpdate({ isLoading: true })
      const result = await humanizePost(platform, postData.content, tone)
      onUpdate({ content: result.humanized_content, isEdited: true, isLoading: false })
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
    if (platform === 'instagram') {
      handleCopy()
      return
    }
    if (platform === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(postData.content)}`
      window.open(url, '_blank', 'noopener')
      return
    }

    // Real posting for twitter / linkedin / reddit
    setPosting(true)
    try {
      const postOptions = platform === 'reddit'
        ? { subreddit: options.subreddit ?? 'r/general', title: postData.raw?.title ?? postData.content.slice(0, 100), ...options }
        : options

      const result = await postToPlatform(platform, postData.content, [], postOptions, postData.post_id)
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
    <div className="flex flex-wrap items-center gap-1">
      <ActionBtn icon={RefreshCw}     label="Regenerate" onClick={handleRegenerate} loading={loadingAction === 'regenerate'} />
      <ActionBtn icon={Wand2}         label="Enhance"    onClick={handleEnhance}    loading={loadingAction === 'enhance'}    />
      <ActionBtn icon={HeartHandshake}label="Humanize"   onClick={handleHumanize}   loading={loadingAction === 'humanize'}   />
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

      {/* Post button */}
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
          background: cfg?.color ?? '#f59e0b',
          boxShadow: `0 0 12px rgba(${cfg?.rgb ?? '245,158,11'},0.3)`,
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
    </div>
  )
}
