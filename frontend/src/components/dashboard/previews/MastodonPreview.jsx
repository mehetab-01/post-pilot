import { Heart, MessageCircle, Repeat2, Share, Globe, MoreHorizontal } from 'lucide-react'
import { FaMastodon } from 'react-icons/fa6'

export function MastodonPreview({ content }) {
  // Split hashtags
  const parts = content.split(/(#\w+)/g)

  return (
    <div className="bg-[#282c37] rounded-xl border border-[#393f4f] overflow-hidden">
      <div className="flex gap-3 px-4 pt-3 pb-1">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-md bg-[#6364ff]/20 flex items-center justify-center flex-shrink-0">
          <FaMastodon size={16} className="text-[#6364ff]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-bold text-[#d9e1e8] truncate">You</span>
            <span className="text-[13px] text-[#606984] truncate">@you@mastodon.social</span>
          </div>
          <p className="text-[15px] text-[#d9e1e8] leading-[1.4] whitespace-pre-wrap break-words">
            {parts.map((part, i) =>
              part.startsWith('#')
                ? <span key={i} className="text-[#6364ff]">{part}</span>
                : part
            )}
          </p>

          {/* Visibility + time */}
          <div className="flex items-center gap-1.5 mt-2 text-[#606984]">
            <Globe size={12} />
            <span className="text-[12px]">Just now</span>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between mt-2 mb-2 max-w-[260px] text-[#606984]">
            <button className="flex items-center gap-1.5 group">
              <MessageCircle size={16} className="group-hover:text-[#6364ff] transition-colors" />
              <span className="text-[13px]">0</span>
            </button>
            <button className="flex items-center gap-1.5 group">
              <Repeat2 size={16} className="group-hover:text-[#2b90d9] transition-colors" />
              <span className="text-[13px]">0</span>
            </button>
            <button className="flex items-center gap-1.5 group">
              <Heart size={16} className="group-hover:text-[#ca8f04] transition-colors" />
              <span className="text-[13px]">0</span>
            </button>
            <button className="group">
              <Share size={16} className="group-hover:text-[#6364ff] transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
