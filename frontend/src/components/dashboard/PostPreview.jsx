import { useState, useRef } from 'react'
import { clsx } from 'clsx'
import { ExternalLink } from 'lucide-react'
import { PLATFORM_MAP, TONE_MAP } from './constants'
import { PostActions } from './PostActions'
import { Badge } from '@/components/ui/Badge'

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
function TwitterContent({ raw, content }) {
  const threads = raw?.thread ?? []
  if (threads.length > 1) {
    return (
      <div className="flex flex-col gap-3">
        {threads.map((tweet, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-muted font-mono">
                {i + 1}
              </div>
              {i < threads.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            <p className="text-sm text-text leading-relaxed pt-1 pb-2">{tweet}</p>
          </div>
        ))}
      </div>
    )
  }
  return <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{content}</p>
}

function LinkedInContent({ raw, content }) {
  // Dim hashtags
  const parts = content.split(/(#\w+)/g)
  return (
    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('#')
          ? <span key={i} className="text-linkedin">{part}</span>
          : part
      )}
    </p>
  )
}

function RedditContent({ raw, content }) {
  const title = raw?.title ?? content.split('\n')[0]
  const body  = raw?.content ?? content.split('\n').slice(1).join('\n').trim()
  const subs  = raw?.subreddits ?? []

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-heading leading-snug">{title}</p>
      {body && <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{body}</p>}
      {subs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {subs.map((s) => (
            <Badge key={s} variant="reddit">{s}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function InstagramContent({ raw, content }) {
  const hashtags = (raw?.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`))
  const mainText = content.replace(/(#\w+\s*)+$/g, '').trim()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{mainText}</p>
      {hashtags.length > 0 && (
        <p className="text-xs text-muted leading-relaxed">
          {hashtags.join(' ')}
        </p>
      )}
    </div>
  )
}

function WhatsAppContent({ content }) {
  return (
    <div className="inline-block max-w-full">
      <div className="bg-zinc-800 rounded-[18px] rounded-tl-sm px-4 py-3 text-sm text-text leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}

function PlatformContent({ platform, raw, content }) {
  if (platform === 'twitter')   return <TwitterContent   raw={raw} content={content} />
  if (platform === 'linkedin')  return <LinkedInContent  raw={raw} content={content} />
  if (platform === 'reddit')    return <RedditContent    raw={raw} content={content} />
  if (platform === 'instagram') return <InstagramContent raw={raw} content={content} />
  if (platform === 'whatsapp')  return <WhatsAppContent  content={content} />
  return <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{content}</p>
}

// ── Main component ────────────────────────────────────────────────────────────
export function PostPreview({ platform, postData, context, platformConfig, isConnected = null, mediaIds = [], onUpdate, onPost }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef(null)

  const cfg       = PLATFORM_MAP[platform]
  const toneData  = TONE_MAP[postData?.tone ?? 'professional']
  const ToneIcon  = toneData?.Icon
  const PlatIcon  = cfg?.Icon

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
        />
      </div>
    </div>
  )
}
