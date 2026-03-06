import { useState, useEffect, useCallback } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import {
  Eye, Heart, Share2, MessageCircle, TrendingUp,
  Trophy, ArrowUpDown, Lock, ExternalLink, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { PageTransition } from '@/components/layout/PageTransition'
import { getOverview, getAnalyticsPosts, getTrends } from '@/services/analytics'
import { PLATFORMS } from '@/components/dashboard/constants'
import { useUsage } from '@/contexts/UsageContext'

const SORT_OPTIONS = [
  { value: 'engagement', label: 'Top Engagement' },
  { value: 'likes',      label: 'Most Likes' },
  { value: 'impressions', label: 'Most Views' },
  { value: 'recent',     label: 'Most Recent' },
]

const CHART_COLORS = {
  impressions: '#8b5cf6',
  likes:       '#f59e0b',
  shares:      '#3b82f6',
  comments:    '#10b981',
}

function platformMeta(id) {
  return PLATFORMS.find((p) => p.id === id) || { label: id, color: '#8b5cf6' }
}

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ── Overview stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  const Icon = icon
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{
        background: 'rgba(139,92,246,0.04)',
        border: '1px solid rgba(139,92,246,0.10)',
      }}
    >
      <div className="flex items-center gap-2 text-muted text-xs font-medium mb-1">
        {Icon && <Icon size={14} style={{ color }} />}
        {label}
      </div>
      <span className="text-2xl font-bold text-heading">{value}</span>
    </div>
  )
}

// ── Locked state ──────────────────────────────────────────────────────────────
function LockedState() {
  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <Lock size={28} className="text-violet-400" />
        </div>
        <h2 className="text-xl font-bold text-heading mb-2">Post Analytics</h2>
        <p className="text-muted text-sm leading-relaxed max-w-md mx-auto">
          Track engagement, discover your best-performing content, and understand your audience.
          Upgrade to Starter or Pro to unlock analytics.
        </p>
      </div>
    </PageTransition>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-xl"
      style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.2)' }}
    >
      <p className="text-muted mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-heading">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { plan } = useUsage()
  const [overview, setOverview] = useState(null)
  const [posts, setPosts] = useState([])
  const [trends, setTrends] = useState(null)
  const [sort, setSort] = useState('engagement')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isPro = plan === 'pro'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, ps] = await Promise.all([getOverview(), getAnalyticsPosts(sort)])
      setOverview(ov)
      setPosts(ps)
      if (isPro) {
        try { setTrends(await getTrends()) } catch { /* Pro-only, ignore if fails */ }
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.error === 'feature_locked') {
        setError('locked')
      } else {
        setError(detail?.message || 'Failed to load analytics')
      }
    } finally {
      setLoading(false)
    }
  }, [sort, isPro])

  useEffect(() => { load() }, [load])

  if (error === 'locked') return <LockedState />

  // ── Platform breakdown chart data ─────────────────────────────────────────
  const breakdownData = overview
    ? Object.entries(overview.platform_breakdown).map(([plat, stats]) => ({
        name: platformMeta(plat).label,
        likes: stats.likes,
        shares: stats.shares,
        comments: stats.comments,
        fill: platformMeta(plat).color,
      }))
    : []

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <BarChart3 size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-heading">Analytics</h1>
            <p className="text-xs text-muted">
              {overview ? `Last ${overview.days} days` : 'Loading…'}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && error !== 'locked' && (
          <p className="text-center text-danger text-sm py-12">{error}</p>
        )}

        {!loading && !error && overview && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Overview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard label="Impressions" value={fmtNum(overview.total_impressions)} icon={Eye} color="#8b5cf6" />
              <StatCard label="Likes"       value={fmtNum(overview.total_likes)}       icon={Heart} color="#f59e0b" />
              <StatCard label="Shares"      value={fmtNum(overview.total_shares)}      icon={Share2} color="#3b82f6" />
              <StatCard label="Comments"    value={fmtNum(overview.total_comments)}    icon={MessageCircle} color="#10b981" />
              <StatCard label="Avg Engagement" value={`${overview.avg_engagement_rate}%`} icon={TrendingUp} color="#8b5cf6" />
            </div>

            {/* Best post */}
            {overview.best_post && (
              <div
                className="rounded-2xl p-5 mb-8 flex items-start gap-4"
                style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
              >
                <Trophy size={20} className="text-amber mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber mb-1">Best Performing Post</p>
                  <p className="text-sm text-text truncate">{overview.best_post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                    <span className="capitalize">{platformMeta(overview.best_post.platform).label}</span>
                    <span>❤️ {overview.best_post.likes}</span>
                    <span>🔄 {overview.best_post.shares}</span>
                    <span>💬 {overview.best_post.comments}</span>
                    {overview.best_post.post_url && (
                      <a
                        href={overview.best_post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Platform breakdown */}
              {breakdownData.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.10)' }}
                >
                  <h3 className="text-sm font-semibold text-heading mb-4">Platform Breakdown</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={breakdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="likes"    stackId="a" fill={CHART_COLORS.likes}    radius={[0, 0, 0, 0]} />
                      <Bar dataKey="shares"   stackId="a" fill={CHART_COLORS.shares}   radius={[0, 0, 0, 0]} />
                      <Bar dataKey="comments" stackId="a" fill={CHART_COLORS.comments} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Engagement trends (Pro only) */}
              {isPro && trends ? (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.10)' }}
                >
                  <h3 className="text-sm font-semibold text-heading mb-4">Engagement Trends</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="likes"    stroke={CHART_COLORS.likes}    strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="shares"   stroke={CHART_COLORS.shares}   strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="comments" stroke={CHART_COLORS.comments} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : !isPro ? (
                <div
                  className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.10)' }}
                >
                  <Lock size={20} className="text-muted mb-2" />
                  <p className="text-sm font-semibold text-heading mb-1">Engagement Trends</p>
                  <p className="text-xs text-muted">Upgrade to Pro to see 30-day trend charts</p>
                </div>
              ) : null}
            </div>

            {/* Top posts table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.10)' }}
            >
              <div className="flex items-center justify-between p-5 pb-3">
                <h3 className="text-sm font-semibold text-heading">Top Posts</h3>
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={13} className="text-muted" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="text-xs bg-transparent text-muted border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-violet-500"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {posts.length === 0 ? (
                <p className="text-center text-muted text-sm py-10">No posted content with metrics yet</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {posts.map((p) => {
                    const meta = platformMeta(p.platform)
                    return (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${meta.color}18` }}
                        >
                          {meta.Icon && <meta.Icon size={14} style={{ color: meta.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text truncate">{p.content}</p>
                          <p className="text-[10px] text-muted mt-0.5">
                            {p.posted_at ? new Date(p.posted_at).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted flex-shrink-0">
                          <span title="Impressions" className="flex items-center gap-1"><Eye size={12} /> {fmtNum(p.metrics.impressions)}</span>
                          <span title="Likes" className="flex items-center gap-1"><Heart size={12} /> {fmtNum(p.metrics.likes)}</span>
                          <span title="Shares" className="flex items-center gap-1"><Share2 size={12} /> {fmtNum(p.metrics.shares)}</span>
                          <span title="Comments" className="flex items-center gap-1"><MessageCircle size={12} /> {fmtNum(p.metrics.comments)}</span>
                        </div>
                        {p.post_url && (
                          <a
                            href={p.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 flex-shrink-0"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
