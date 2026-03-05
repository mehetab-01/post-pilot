import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react'

export function RedditPreview({ raw, content }) {
  const title = raw?.title ?? content.split('\n')[0]
  const body  = raw?.content ?? content.split('\n').slice(1).join('\n').trim()
  const subs  = raw?.subreddits ?? []

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Sub header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 border-b border-zinc-200">
        <div className="w-6 h-6 rounded-full bg-[#ff4500] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">r/</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-semibold text-zinc-900">
            {subs.length > 0 ? subs[0] : 'r/subreddit'}
          </span>
          <span className="text-[11px] text-zinc-400 ml-2">• Posted by u/you • Just now</span>
        </div>
        <MoreHorizontal size={16} className="text-zinc-400" />
      </div>

      <div className="flex">
        {/* Vote sidebar */}
        <div className="flex flex-col items-center gap-0.5 px-2 py-3 bg-zinc-50">
          <ArrowBigUp size={20} className="text-zinc-400 hover:text-[#ff4500] cursor-pointer" />
          <span className="text-[12px] font-semibold text-zinc-700">0</span>
          <ArrowBigDown size={20} className="text-zinc-400 hover:text-[#7193ff] cursor-pointer" />
        </div>

        {/* Content */}
        <div className="flex-1 py-3 pr-3 pl-1.5">
          <h3 className="text-[16px] font-semibold text-zinc-900 leading-snug mb-2">{title}</h3>
          {body && (
            <p className="text-[14px] text-zinc-700 leading-relaxed whitespace-pre-wrap break-words">{body}</p>
          )}

          {/* Subreddit badges */}
          {subs.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {subs.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-[#ff4500]/10 text-[#ff4500] text-[11px] font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-zinc-200">
        {[
          { icon: MessageSquare, label: '0 Comments' },
          { icon: Share2, label: 'Share' },
          { icon: Bookmark, label: 'Save' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded text-[12px] font-medium transition-colors"
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
