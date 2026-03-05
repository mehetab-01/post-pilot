import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

export function InstagramPreview({ raw, content }) {
  const [liked, setLiked] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const hashtags = (raw?.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`))
  const mainText = content.replace(/(#\w+\s*)+$/g, '').trim()
  const lines = mainText.split('\n')
  const shouldTruncate = lines.length > 2 && !expanded

  return (
    <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
          <div className="w-full h-full rounded-full bg-black" />
        </div>
        <span className="text-[13px] font-semibold text-white flex-1">you</span>
        <MoreHorizontal size={18} className="text-zinc-400" />
      </div>

      {/* Image placeholder */}
      <div className="aspect-square bg-zinc-900 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-zinc-800 flex items-center justify-center">
            <span className="text-2xl">📷</span>
          </div>
          <p className="text-[11px] text-zinc-600">Image preview</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center px-3 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => setLiked(!liked)}>
            <Heart size={22} className={liked ? 'text-red-500 fill-red-500' : 'text-white'} />
          </button>
          <MessageCircle size={22} className="text-white" />
          <Send size={22} className="text-white" />
        </div>
        <Bookmark size={22} className="text-white ml-auto" />
      </div>

      {/* Likes */}
      <p className="px-3 text-[13px] font-semibold text-white">0 likes</p>

      {/* Caption */}
      <div className="px-3 py-2 pb-3">
        <p className="text-[13px] text-white leading-[1.4] whitespace-pre-wrap break-words">
          <span className="font-semibold">you </span>
          {shouldTruncate ? lines.slice(0, 2).join('\n') : mainText}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(true)}
              className="text-zinc-500 ml-1"
            >
              ...more
            </button>
          )}
        </p>
        {hashtags.length > 0 && (expanded || !shouldTruncate) && (
          <p className="text-[13px] text-[#00376b] mt-1">
            {hashtags.join(' ')}
          </p>
        )}
        <p className="text-[11px] text-zinc-500 mt-1.5 uppercase">Just now</p>
      </div>
    </div>
  )
}
