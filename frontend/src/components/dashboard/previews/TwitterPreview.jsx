import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, BadgeCheck } from 'lucide-react'

function TweetCard({ text, index, isLast, total }) {
  return (
    <div className="flex gap-3">
      {/* Avatar + thread line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-zinc-700" />
        {!isLast && <div className="w-0.5 flex-1 bg-zinc-700 mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13px] font-bold text-white truncate">You</span>
          <BadgeCheck size={14} className="text-[#1d9bf0] flex-shrink-0" />
          <span className="text-[13px] text-zinc-500 truncate">@you</span>
          <span className="text-[13px] text-zinc-500">·</span>
          <span className="text-[13px] text-zinc-500">now</span>
          {total > 1 && (
            <span className="text-[11px] text-zinc-600 ml-auto">{index + 1}/{total}</span>
          )}
        </div>
        <p className="text-[15px] text-zinc-100 leading-[1.35] whitespace-pre-wrap break-words">{text}</p>

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3 max-w-[300px] text-zinc-600">
          <button className="flex items-center gap-1.5 group">
            <MessageCircle size={15} className="group-hover:text-[#1d9bf0] transition-colors" />
            <span className="text-[13px]">0</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <Repeat2 size={15} className="group-hover:text-green-500 transition-colors" />
            <span className="text-[13px]">0</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <Heart size={15} className="group-hover:text-pink-500 transition-colors" />
            <span className="text-[13px]">0</span>
          </button>
          <button className="group">
            <Share size={15} className="group-hover:text-[#1d9bf0] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function TwitterPreview({ raw, content }) {
  const threads = raw?.thread ?? []

  if (threads.length > 1) {
    return (
      <div className="bg-black rounded-xl border border-zinc-800 px-4 pt-3 pb-1 space-y-0">
        {threads.map((tweet, i) => (
          <TweetCard
            key={i}
            text={tweet}
            index={i}
            isLast={i === threads.length - 1}
            total={threads.length}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-black rounded-xl border border-zinc-800 px-4 pt-3 pb-1">
      <TweetCard text={content} index={0} isLast total={1} />
    </div>
  )
}
