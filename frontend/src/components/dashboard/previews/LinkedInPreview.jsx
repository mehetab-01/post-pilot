import { ThumbsUp, MessageCircle, Repeat2, Send, MoreHorizontal, Globe } from 'lucide-react'
import { useState } from 'react'

export function LinkedInPreview({ raw, content }) {
  const [expanded, setExpanded] = useState(false)

  // Split content and hashtags
  const parts = content.split(/(#\w+)/g)
  const lines = content.split('\n')
  const shouldTruncate = lines.length > 4 && !expanded
  const displayText = shouldTruncate ? lines.slice(0, 4).join('\n') : content

  const displayParts = displayText.split(/(#\w+)/g)

  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      {/* Author header */}
      <div className="flex items-start gap-2.5 px-4 pt-4 pb-2">
        <div className="w-12 h-12 rounded-full bg-zinc-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-zinc-900">You</span>
            <span className="text-[12px] text-zinc-500">• 1st</span>
          </div>
          <p className="text-[12px] text-zinc-500 leading-tight truncate">Content Creator</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[11px] text-zinc-400">Just now</span>
            <span className="text-[11px] text-zinc-400">•</span>
            <Globe size={10} className="text-zinc-400" />
          </div>
        </div>
        <MoreHorizontal size={18} className="text-zinc-400 flex-shrink-0" />
      </div>

      {/* Post text */}
      <div className="px-4 pb-2">
        <p className="text-[14px] text-zinc-900 leading-[1.4] whitespace-pre-wrap break-words">
          {displayParts.map((part, i) =>
            part.startsWith('#')
              ? <span key={i} className="text-[#0a66c2] font-medium">{part}</span>
              : part
          )}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(true)}
              className="text-zinc-500 hover:text-zinc-700 ml-1"
            >
              ...see more
            </button>
          )}
        </p>
      </div>

      {/* Engagement */}
      <div className="flex items-center gap-2 px-4 py-2 text-[12px] text-zinc-500">
        <div className="flex -space-x-1">
          <div className="w-4 h-4 rounded-full bg-[#0a66c2] border border-white" />
          <div className="w-4 h-4 rounded-full bg-red-500 border border-white" />
        </div>
        <span>0 reactions</span>
        <span className="ml-auto">0 comments</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center border-t border-zinc-200 px-2">
        {[
          { icon: ThumbsUp, label: 'Like' },
          { icon: MessageCircle, label: 'Comment' },
          { icon: Repeat2, label: 'Repost' },
          { icon: Send, label: 'Send' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-zinc-600 hover:bg-zinc-100 transition-colors rounded"
          >
            <Icon size={16} />
            <span className="text-[12px] font-medium hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
