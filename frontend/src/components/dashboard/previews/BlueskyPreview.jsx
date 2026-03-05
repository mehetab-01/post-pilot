import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from 'lucide-react'
import { FaBluesky } from 'react-icons/fa6'

export function BlueskyPreview({ content }) {
  return (
    <div className="bg-[#161e27] rounded-xl border border-[#2a3441] overflow-hidden">
      <div className="flex gap-3 px-4 pt-3 pb-1">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#0085ff]/20 flex items-center justify-center flex-shrink-0">
          <FaBluesky size={16} className="text-[#0085ff]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-bold text-white truncate">You</span>
            <span className="text-[13px] text-[#7b8da0] truncate">@you.bsky.social</span>
            <span className="text-[13px] text-[#7b8da0]">·</span>
            <span className="text-[13px] text-[#7b8da0]">now</span>
          </div>
          <p className="text-[15px] text-[#e4eaf0] leading-[1.35] whitespace-pre-wrap break-words">{content}</p>

          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 mb-2 max-w-[280px] text-[#546371]">
            <button className="flex items-center gap-1.5 group">
              <MessageCircle size={15} className="group-hover:text-[#0085ff] transition-colors" />
              <span className="text-[13px]">0</span>
            </button>
            <button className="flex items-center gap-1.5 group">
              <Repeat2 size={15} className="group-hover:text-green-400 transition-colors" />
              <span className="text-[13px]">0</span>
            </button>
            <button className="flex items-center gap-1.5 group">
              <Heart size={15} className="group-hover:text-pink-400 transition-colors" />
              <span className="text-[13px]">0</span>
            </button>
            <button className="group">
              <Share size={15} className="group-hover:text-[#0085ff] transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
