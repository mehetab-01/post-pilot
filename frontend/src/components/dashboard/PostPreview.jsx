import { useState, useRef } from 'react'
import { clsx } from 'clsx'
import { ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { PLATFORM_MAP, TONE_MAP } from './constants'
import { PostActions } from './PostActions'
import { HumanizeScore } from './HumanizeScore'
import { OriginalityScore } from './OriginalityScore'
import { Badge } from '@/components/ui/Badge'
import { humanizePost } from '@/services/generate'

import { TwitterPreview } from './previews/TwitterPreview'
import { LinkedInPreview } from './previews/LinkedInPreview'
import { RedditPreview } from './previews/RedditPreview'
import { InstagramPreview } from './previews/InstagramPreview'
import { WhatsAppPreview } from './previews/WhatsAppPreview'
import { BlueskyPreview } from './previews/BlueskyPreview'
import { MastodonPreview } from './previews/MastodonPreview'

// ── Char count indicator ──────────────────────────────────────────────────────
function CharCount({ count, limit }) {
  const pct = limit > 0 ? count / limit : 0
  const color = pct > 0.95 ? 'text-danger' : pct > 0.80 ? 'text-amber' : 'text-green-400'
  if (limit > 10000) return null // Reddit: skip
  return (
    <span className={clsx('text-xs font-mono', color)}>
      {count.toLocaleString()} / {limit.toLocaleString()}
    </span>
  )
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer() {
  return (
    <div className="flex flex-col gap-3 py-2">
      {[100, 80, 90, 60].map((w, i) => (
        <div key={i} className="h-4 rounded-lg shimmer" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

// ── Platform-specific content renderers ──────────────────────────────────────
function PlatformContent({ platform, raw, content }) {
  switch (platform) {
    case 'twitter':   return <TwitterPreview   raw={raw} content={content} />
    case 'linkedin':  return <LinkedInPreview  raw={raw} content={content} />
    case 'reddit':    return <RedditPreview    raw={raw} content={content} />
    case 'instagram': return <InstagramPreview raw={raw} content={content} />
    case 'whatsapp':  return <WhatsAppPreview  content={content} />
    case 'bluesky':   return <BlueskyPreview   content={content} />
    case 'mastodon':  return <MastodonPreview  content={content} />
    default:
      return <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{content}</p>
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export function PostPreview({ platform, postData, context, platformConfig, isConnected = null, mediaIds = [], scoreData, scoreLoading, originalityData, originalityLoading, onUpdate, onPost, onRescoreNeeded, canDirectPost, canHumanize, canOriginality, onUpgrade }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef(null)

  const cfg       = PLATFORM_MAP[platform]
  const toneData  = TONE_MAP[postData?.tone ?? 'professional']
  const ToneIcon  = toneData?.Icon
  const PlatIcon  = cfg?.Icon

  async function handleHumanizeFromBadge() {
    if (!canHumanize) { onUpgrade?.('AI Humanizer'); return }
    const tone = platformConfig?.tone ?? 'professional'
    const result = await humanizePost(platform, postData.content, tone)
    onUpdate({ content: result.humanized_content, isEdited: true })
    onRescoreNeeded?.(result.humanized_content)
    toast.success('Humanized')
  }

  function startEdit() {
    setEditValue(postData.content)
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function finishEdit() {
    if (editValue !== postData.content) {
      onUpdate({ content: editValue, isEdited: true })
    }
    setIsEditing(false)
  }

  function handleToggleEdit() {
    isEditing ? finishEdit() : startEdit()
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        {/* Platform icon */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
          style={{ background: `rgba(${cfg?.rgb},0.12)`, border: `1px solid rgba(${cfg?.rgb},0.25)` }}
        >
          {PlatIcon && <PlatIcon size={14} style={{ color: cfg?.color }} />}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-heading">{cfg?.label ?? platform}</span>
          {postData.isEdited && <Badge variant="amber">Edited</Badge>}
          {postData.posted && (
            <a
              href={postData.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
            >
              <ExternalLink size={11} />
              Posted
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Content Quality bar: Human score + Originality score */}
          {!postData.isLoading && (
            <div className="flex items-center gap-1.5">
              <HumanizeScore
                scoreData={canHumanize ? scoreData : null}
                loading={canHumanize ? scoreLoading : false}
                onHumanize={handleHumanizeFromBadge}
                locked={!canHumanize}
                onUpgrade={() => onUpgrade?.('AI Humanizer')}
              />
              <OriginalityScore
                scoreData={canOriginality ? originalityData : null}
                loading={canOriginality ? originalityLoading : false}
                locked={!canOriginality}
                onUpgrade={() => onUpgrade?.('Originality Check')}
              />
            </div>
          )}
          {/* Tone badge */}
          {ToneIcon && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-muted border border-border bg-zinc-900">
              <ToneIcon size={11} />
              {toneData?.label}
            </span>
          )}
          {/* Char count */}
          <CharCount count={postData.content?.length ?? 0} limit={cfg?.limit ?? 0} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 min-h-[100px]">
        {postData.isLoading ? (
          <Shimmer />
        ) : isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={finishEdit}
            className={clsx(
              'w-full resize-none rounded-xl border border-amber/40 bg-bg',
              'px-3 py-3 text-sm text-text leading-relaxed',
              'focus:outline-none focus:ring-2 focus:ring-amber/30',
              'min-h-[140px]',
            )}
          />
        ) : (
          <PlatformContent
            platform={platform}
            raw={postData.raw}
            content={postData.content}
          />
        )}

        {/* Media suggestion */}
        {!postData.isLoading && postData.raw?.media_suggestion && (
          <p className="mt-3 text-xs text-muted italic border-t border-border pt-3">
            Tip: {postData.raw.media_suggestion}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-border">
        <PostActions
          platform={platform}
          postData={postData}
          context={context}
          platformConfig={platformConfig}
          isConnected={isConnected}
          mediaIds={mediaIds}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
          onUpdate={onUpdate}
          onPost={onPost}
          onRescoreNeeded={onRescoreNeeded}
          canDirectPost={canDirectPost}
          onUpgrade={onUpgrade}
        />
      </div>
    </div>
  )
}
