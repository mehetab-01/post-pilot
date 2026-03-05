import { useState } from 'react'
import { Lightbulb, RefreshCw, Loader2, Sparkles, Lock } from 'lucide-react'
import { FaXTwitter, FaLinkedinIn, FaRedditAlien, FaInstagram, FaBluesky, FaMastodon } from 'react-icons/fa6'
import { toast } from 'react-hot-toast'
import { generateIdeas } from '@/services/ideas'

const PLATFORM_ICONS = {
  twitter:   FaXTwitter,
  linkedin:  FaLinkedinIn,
  reddit:    FaRedditAlien,
  instagram: FaInstagram,
  bluesky:   FaBluesky,
  mastodon:  FaMastodon,
}

const PLATFORM_COLORS = {
  twitter:   '#94a3b8',
  linkedin:  '#0a66c2',
  reddit:    '#ff4500',
  instagram: '#e1306c',
  bluesky:   '#0085ff',
  mastodon:  '#6364ff',
}

export function IdeasPanel({ onSelectIdea, niche }) {
  const [open, setOpen] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(false)
  const [usageInfo, setUsageInfo] = useState(null)

  async function fetchIdeas() {
    setLoading(true)
    try {
      const data = await generateIdeas(niche || null, null)
      setIdeas(data.ideas)
      setUsageInfo({ used: data.used_today, limit: data.limit_today })
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail?.error === 'ideas_limit') {
        toast.error(detail.message)
      } else {
        toast.error('Failed to generate ideas')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    if (ideas.length === 0) fetchIdeas()
  }

  function handleSelect(idea) {
    onSelectIdea(idea)
    setOpen(false)
  }

  return (
    <div className="inline-block align-top">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber/80 hover:text-amber bg-amber/5 hover:bg-amber/10 border border-amber/20 transition-colors mb-2"
      >
        <Lightbulb size={13} />
        {open ? 'Close ideas' : 'Need post ideas?'}
      </button>

      {open && (
        <div className="w-full bg-surface border border-border rounded-xl overflow-hidden shadow-xl shadow-black/30">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Sparkles size={14} className="text-amber" />
            <span className="text-sm font-semibold text-heading flex-1">Post Ideas</span>
            {usageInfo && (
              <span className="text-[10px] text-muted">
                {usageInfo.used}/{usageInfo.limit} today
              </span>
            )}
            <button
              onClick={fetchIdeas}
              disabled={loading}
              className="p-1 rounded-md text-muted hover:text-amber hover:bg-amber/10 transition-colors disabled:opacity-50"
              title="Refresh ideas"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] text-muted hover:text-text transition-colors"
            >
              Close
            </button>
          </div>

          {/* Content */}
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            {loading && ideas.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted" />
              </div>
            ) : ideas.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                Click refresh to generate post ideas
              </p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {ideas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(idea)}
                    className="min-w-[260px] max-w-xs text-left p-4 rounded-xl bg-bg hover:bg-zinc-800/80 border border-border hover:border-amber/30 transition-all group shadow-sm"
                  >
                    <p className="text-base font-semibold text-text group-hover:text-amber transition-colors mb-1">
                      {idea.title}
                    </p>
                    <p className="text-xs text-muted leading-relaxed mb-2">
                      {idea.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {(idea.platforms ?? []).map((p) => {
                          const Icon = PLATFORM_ICONS[p]
                          const color = PLATFORM_COLORS[p]
                          return Icon ? (
                            <span
                              key={p}
                              className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: `${color}15` }}
                            >
                              <Icon size={10} style={{ color }} />
                            </span>
                          ) : null
                        })}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-muted border border-border capitalize">
                        {idea.tone}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
