import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Clock, Trash2, RotateCcw, CalendarClock, CheckCircle2, XCircle, Loader2, Lock } from 'lucide-react'
import { FaXTwitter, FaLinkedinIn, FaRedditAlien, FaInstagram, FaWhatsapp, FaBluesky, FaMastodon } from 'react-icons/fa6'
import { PageTransition } from '@/components/layout/PageTransition'
import { useUsage } from '@/contexts/UsageContext'
import {
  listScheduledPosts,
  cancelScheduledPost,
  reschedulePost,
  retryScheduledPost,
} from '@/services/schedule'

const PLATFORM_META = {
  twitter:   { label: 'X / Twitter', Icon: FaXTwitter,   color: '#94a3b8' },
  linkedin:  { label: 'LinkedIn',    Icon: FaLinkedinIn,  color: '#0a66c2' },
  reddit:    { label: 'Reddit',      Icon: FaRedditAlien, color: '#ff4500' },
  instagram: { label: 'Instagram',   Icon: FaInstagram,   color: '#e1306c' },
  whatsapp:  { label: 'WhatsApp',    Icon: FaWhatsapp,    color: '#25d366' },
  bluesky:   { label: 'Bluesky',     Icon: FaBluesky,     color: '#0085ff' },
  mastodon:  { label: 'Mastodon',    Icon: FaMastodon,    color: '#6364ff' },
}

const STATUS_STYLES = {
  pending:   { label: 'Pending',   bg: 'bg-amber/10',  text: 'text-amber',     icon: Clock },
  posting:   { label: 'Posting',   bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Loader2 },
  posted:    { label: 'Posted',    bg: 'bg-emerald/10', text: 'text-emerald',   icon: CheckCircle2 },
  failed:    { label: 'Failed',    bg: 'bg-red-500/10', text: 'text-red-400',   icon: XCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: XCircle },
}

const FILTER_TABS = ['all', 'pending', 'posted', 'failed', 'cancelled']

function formatScheduledTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Scheduled() {
  const { plan } = useUsage()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState({}) // { [id]: true }

  const isPro = plan === 'pro'

  const fetchPosts = useCallback(async () => {
    if (!isPro) { setLoading(false); return }
    try {
      const data = await listScheduledPosts(filter === 'all' ? undefined : filter)
      setPosts(data)
    } catch {
      toast.error('Failed to load scheduled posts')
    } finally {
      setLoading(false)
    }
  }, [filter, isPro])

  useEffect(() => {
    document.title = 'Scheduled | PostPilot'
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchPosts()
  }, [fetchPosts])

  async function handleCancel(id) {
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      await cancelScheduledPost(id)
      toast.success('Post cancelled')
      fetchPosts()
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }))
    }
  }

  async function handleRetry(id) {
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      await retryScheduledPost(id)
      toast.success('Post queued for retry')
      fetchPosts()
    } catch {
      toast.error('Failed to retry')
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }))
    }
  }

  async function handleReschedule(id) {
    const input = prompt('Enter new date/time (YYYY-MM-DD HH:MM):')
    if (!input) return
    const parsed = new Date(input.replace(' ', 'T'))
    if (isNaN(parsed.getTime())) {
      toast.error('Invalid date format')
      return
    }
    setActionLoading((p) => ({ ...p, [id]: true }))
    try {
      await reschedulePost(id, parsed.toISOString())
      toast.success('Post rescheduled')
      fetchPosts()
    } catch {
      toast.error('Failed to reschedule')
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }))
    }
  }

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-3xl font-bold text-heading mb-2"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Scheduled Posts
        </h1>
        <p className="text-muted text-sm max-w-xl leading-relaxed">
          View and manage your upcoming scheduled posts.
        </p>
      </div>

      {!isPro ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <Lock size={28} className="text-violet-400" />
          </div>
          <h2 className="text-lg font-bold text-heading mb-2">Post Scheduling</h2>
          <p className="text-muted text-sm max-w-md leading-relaxed">
            Queue posts and publish them at the perfect time. Upgrade to Pro to unlock scheduling.
          </p>
        </div>
      ) : (
      <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === tab
                ? 'bg-amber/15 text-amber border border-amber/30'
                : 'bg-surface border border-border text-muted hover:text-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarClock size={40} className="text-muted/30 mb-4" />
          <p className="text-muted text-sm">
            {filter === 'all'
              ? 'No scheduled posts yet. Generate content and schedule it for later!'
              : `No ${filter} posts.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const pm = PLATFORM_META[post.platform] ?? { label: post.platform, Icon: Clock, color: '#94a3b8' }
            const ss = STATUS_STYLES[post.status] ?? STATUS_STYLES.pending
            const StatusIcon = ss.icon
            const isLoading = actionLoading[post.id]

            return (
              <div
                key={post.id}
                className="bg-surface border border-border rounded-xl p-4 flex gap-4 items-start"
              >
                {/* Platform icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${pm.color}15` }}
                >
                  <pm.Icon size={16} style={{ color: pm.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-text">{pm.label}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${ss.bg} ${ss.text}`}>
                      <StatusIcon size={10} className={post.status === 'posting' ? 'animate-spin' : ''} />
                      {ss.label}
                    </span>
                  </div>

                  <p className="text-sm text-muted line-clamp-2 mb-2">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted/70">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatScheduledTime(post.scheduled_at)}
                    </span>
                    {post.error && (
                      <span className="text-red-400 truncate max-w-[200px]" title={post.error}>
                        {post.error}
                      </span>
                    )}
                    {post.post_url && (
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber hover:underline"
                      >
                        View post →
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {post.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReschedule(post.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-muted hover:text-amber hover:bg-amber/10 transition-colors disabled:opacity-50"
                        title="Reschedule"
                      >
                        <CalendarClock size={14} />
                      </button>
                      <button
                        onClick={() => handleCancel(post.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {post.status === 'failed' && (
                    <>
                      <button
                        onClick={() => handleRetry(post.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-muted hover:text-amber hover:bg-amber/10 transition-colors disabled:opacity-50"
                        title="Retry"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => handleReschedule(post.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                        title="Reschedule"
                      >
                        <CalendarClock size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}
    </PageTransition>
  )
}
