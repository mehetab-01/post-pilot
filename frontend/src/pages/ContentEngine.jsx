import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  Sparkles, Lock, CalendarDays, RefreshCw, Clock, ChevronDown, ChevronUp,
  Copy, Calendar, Zap, CheckCircle2, Loader2, Star,
} from 'lucide-react'
import gsap from 'gsap'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/Button'
import { useUsage } from '@/contexts/UsageContext'
import { engineApi } from '@/services/engine'

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2' },
  { id: 'twitter',   label: 'X/Twitter', color: '#1d9bf0' },
  { id: 'reddit',    label: 'Reddit',    color: '#ff4500' },
  { id: 'instagram', label: 'Instagram', color: '#e1306c' },
  { id: 'bluesky',   label: 'Bluesky',   color: '#0085ff' },
  { id: 'mastodon',  label: 'Mastodon',  color: '#6364ff' },
]

const STYLES = [
  { id: 'balanced',       label: 'Balanced',       desc: 'Mix of educational, personal, and engaging' },
  { id: 'aggressive',     label: 'Aggressive',     desc: 'Viral-optimized, bold takes, high engagement' },
  { id: 'educational',    label: 'Educational',    desc: 'Teaching-focused, value-heavy content' },
  { id: 'personal-brand', label: 'Personal Brand', desc: 'Storytelling, behind-the-scenes, authentic' },
]

const PLATFORM_COLORS = {
  linkedin: '#0a66c2', twitter: '#1d9bf0', reddit: '#ff4500',
  instagram: '#e1306c', bluesky: '#0085ff', mastodon: '#6364ff',
  whatsapp: '#25d366',
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ── Lock screen (Free/Starter) ─────────────────────────────────────────────────

function LockScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Fake calendar preview (blurred) */}
      <div className="relative w-full max-w-2xl mb-8 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="blur-sm pointer-events-none select-none opacity-60">
          {[
            { day: 'Monday',    platform: 'LinkedIn',  angle: 'The origin story',        color: '#0a66c2' },
            { day: 'Tuesday',   platform: 'X/Twitter', angle: 'Hot take on the industry', color: '#1d9bf0' },
            { day: 'Wednesday', platform: 'Reddit',    angle: 'How-to breakdown',          color: '#ff4500' },
            { day: 'Thursday',  platform: 'Instagram', angle: 'Behind the scenes',         color: '#e1306c' },
            { day: 'Friday',    platform: 'LinkedIn',  angle: 'Metrics & results',          color: '#0a66c2' },
          ].map((item) => (
            <div key={item.day}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-zinc-800 bg-surface last:border-0">
              <div className="w-[90px] text-xs font-medium text-muted">{item.day}</div>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <div className="text-xs font-medium text-text">{item.platform}</div>
              <div className="flex-1 text-xs text-muted truncate">{item.angle}</div>
              <div className="w-16 h-4 rounded bg-zinc-700 opacity-50" />
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(2px)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Lock size={22} className="text-amber" />
          </div>
          <p className="text-sm font-semibold text-heading">Pro Feature</p>
          <p className="text-xs text-muted mt-1">Upgrade to unlock the Content Engine</p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
          <Star size={12} /> Pro Only
        </div>
        <h2 className="text-2xl font-bold text-heading mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          One idea. A full week of content.
        </h2>
        <p className="text-muted text-sm leading-relaxed mb-6">
          Give us one context and the Content Engine generates 7 unique posts across all your platforms —
          different angles, different tones, perfectly matched to each platform. Hours of work in seconds.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          {[
            '7 unique posts from 1 idea',
            'Different angle every day',
            'Platform-optimized content',
            'Best posting times (IST)',
            'Regenerate any single day',
            'Schedule entire week in 1 click',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-xs text-text">
              <CheckCircle2 size={13} className="text-amber flex-shrink-0" />
              {feat}
            </div>
          ))}
        </div>

        <a href="/pricing">
          <Button variant="primary" className="w-full">
            <Zap size={14} /> Upgrade to Pro — ₹1,499/mo
          </Button>
        </a>
      </div>
    </div>
  )
}

// ── Day card ──────────────────────────────────────────────────────────────────

function DayCard({ day, planId, onRegenerated }) {
  const [expanded, setExpanded] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const color = PLATFORM_COLORS[day.platform] || '#8b5cf6'

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const res = await engineApi.regenerateDay({ plan_id: planId, day: day.day })
      onRegenerated(res.data.day)
      toast.success(`Day ${day.day} regenerated`)
    } catch {
      toast.error('Failed to regenerate day')
    } finally {
      setRegenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(day.content || '')
    toast.success('Copied to clipboard')
  }

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid rgba(${hexToRgb(color)}, 0.2)`, background: '#18181b' }}
    >
      {/* Card header */}
      <button
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Day + platform pill */}
        <div className="flex-shrink-0 w-[72px]">
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Day {day.day}
          </div>
          <div className="text-xs font-semibold text-heading mt-0.5">
            {day.day_name || DAY_NAMES[day.day] || `Day ${day.day}`}
          </div>
        </div>

        {/* Platform dot */}
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />

        {/* Platform + angle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold" style={{ color }}>
              {day.platform?.charAt(0).toUpperCase() + day.platform?.slice(1)}
            </span>
            <span className="text-[10px] text-muted">·</span>
            <span className="text-[10px] font-medium text-muted capitalize">{day.tone}</span>
          </div>
          <p className="text-xs text-text truncate">{day.angle}</p>
        </div>

        {/* Best time */}
        {day.best_time && (
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted flex-shrink-0">
            <Clock size={10} />
            {day.best_time}
          </div>
        )}

        {/* Chevron */}
        <div className="text-muted flex-shrink-0 ml-2">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-zinc-800/60">
              {/* Why this day */}
              {day.why_this_day && (
                <p className="text-[11px] text-muted mt-3 mb-3 italic leading-relaxed">
                  {day.why_this_day}
                </p>
              )}

              {/* Content */}
              <div className="rounded-xl p-3.5 mb-3 text-sm text-text leading-relaxed whitespace-pre-wrap"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {day.content}
              </div>

              {/* Hashtags */}
              {day.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {day.hashtags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: `rgba(${hexToRgb(color)}, 0.1)`, color }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Media suggestion */}
              {day.media_suggestion && (
                <p className="text-[10px] text-muted mb-3 flex items-center gap-1.5">
                  <span className="text-amber">📸</span> {day.media_suggestion}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-text hover:bg-white/5 transition-colors"
                >
                  <Copy size={12} /> Copy
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-text hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {regenerating
                    ? <Loader2 size={12} className="animate-spin" />
                    : <RefreshCw size={12} />}
                  Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Week calendar view ────────────────────────────────────────────────────────

function WeekCalendar({ plan, planId, strategyNote, onSchedule, scheduling }) {
  const [days, setDays] = useState(plan)

  function handleRegenerated(updatedDay) {
    setDays((prev) => prev.map((d) => d.day === updatedDay.day ? updatedDay : d))
  }

  return (
    <div>
      {strategyNote && (
        <div className="px-4 py-3 rounded-xl mb-5 text-xs text-muted leading-relaxed"
          style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <span className="font-semibold text-amber">Strategy: </span>{strategyNote}
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-6">
        {days.map((day, i) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <DayCard day={day} planId={planId} onRegenerated={handleRegenerated} />
          </motion.div>
        ))}
      </div>

      <div className="sticky bottom-6 flex justify-center">
        <button
          onClick={onSchedule}
          disabled={scheduling}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-xl transition-all hover:brightness-110 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' }}
        >
          {scheduling
            ? <><Loader2 size={15} className="animate-spin" /> Scheduling...</>
            : <><Calendar size={15} /> Schedule Entire Week</>}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContentEngine() {
  const { plan } = useUsage()
  const isPro = plan === 'pro'

  const [context, setContext]           = useState('')
  const [selectedPlatforms, setPlats]   = useState(['linkedin', 'twitter', 'reddit', 'instagram'])
  const [days, setDays]                 = useState(7)
  const [style, setStyle]               = useState('balanced')
  const [generating, setGenerating]     = useState(false)
  const [scheduling, setScheduling]     = useState(false)
  const [result, setResult]             = useState(null)   // { planId, weekPlan, strategyNote }
  const headerRef = useRef(null)

  useEffect(() => { document.title = 'Content Engine | PostPilot' }, [])

  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
    )
  }, [])

  function togglePlatform(id) {
    setPlats((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleGenerate() {
    if (!context.trim()) { toast.error('Enter a topic or context first'); return }
    if (selectedPlatforms.length < 2) { toast.error('Select at least 2 platforms'); return }
    setGenerating(true)
    setResult(null)
    try {
      const res = await engineApi.generateWeek({
        context: context.trim(),
        platforms: selectedPlatforms,
        days,
        style,
      })
      setResult({
        planId: res.data.plan_id,
        weekPlan: res.data.week_plan,
        strategyNote: res.data.strategy_note,
      })
      toast.success('Your week plan is ready!')
    } catch (err) {
      const msg = err?.response?.data?.detail
      toast.error(typeof msg === 'string' ? msg : 'Generation failed. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSchedule() {
    if (!result) return
    const startDate = new Date()
    // Start from next Monday
    const day = startDate.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    startDate.setDate(startDate.getDate() + daysUntilMonday)
    const start = startDate.toISOString().split('T')[0]

    setScheduling(true)
    try {
      const res = await engineApi.scheduleWeek({ plan_id: result.planId, start_date: start })
      toast.success(`${res.data.scheduled} posts scheduled starting ${start}`)
    } catch {
      toast.error('Scheduling failed')
    } finally {
      setScheduling(false)
    }
  }

  return (
    <PageTransition>
      {/* Header */}
      <div ref={headerRef} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted font-medium">Pro Feature</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
            <Sparkles size={9} /> Pro
          </span>
        </div>
        <h1 className="text-3xl font-bold text-heading mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Content Engine
        </h1>
        <p className="text-muted text-sm max-w-xl leading-relaxed">
          One idea. Seven unique posts. Every platform covered for the entire week.
        </p>
      </div>

      {/* Show lock screen for non-Pro */}
      {!isPro ? (
        <LockScreen />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* ── Input panel ── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-6">

            {/* Context */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2 block">
                Your Idea / Topic
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. I just launched a SaaS tool that helps creators repurpose content across social media..."
                className="w-full bg-transparent text-sm text-text placeholder:text-zinc-600 resize-none outline-none leading-relaxed"
                rows={5}
                maxLength={10000}
              />
              <div className="flex justify-end mt-2">
                <span className="text-[10px] text-muted">{context.length}/10000</span>
              </div>
            </div>

            {/* Platforms */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 block">
                Platforms to Use
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={active
                        ? { background: `rgba(${hexToRgb(p.color)}, 0.15)`, color: p.color, border: `1px solid rgba(${hexToRgb(p.color)}, 0.4)` }
                        : { background: 'transparent', color: '#71717a', border: '1px solid #3f3f46' }
                      }
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 block">
                Duration
              </label>
              <div className="flex gap-2">
                {[
                  { value: 5, label: '5 days', sub: 'Weekdays' },
                  { value: 7, label: '7 days', sub: 'Full week' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDays(opt.value)}
                    className="flex-1 py-2.5 rounded-xl text-center transition-all"
                    style={days === opt.value
                      ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)' }
                      : { background: 'transparent', border: '1px solid #3f3f46' }
                    }
                  >
                    <div className="text-sm font-semibold text-heading">{opt.label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 block">
                Content Style
              </label>
              <div className="flex flex-col gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all"
                    style={style === s.id
                      ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)' }
                      : { background: 'transparent', border: '1px solid transparent' }
                    }
                  >
                    <div className="mt-0.5 w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors"
                      style={{ borderColor: style === s.id ? '#8b5cf6' : '#52525b',
                               background: style === s.id ? '#8b5cf6' : 'transparent' }} />
                    <div>
                      <div className="text-xs font-semibold text-heading">{s.label}</div>
                      <div className="text-[10px] text-muted mt-0.5">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !context.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              {generating
                ? <><Loader2 size={16} className="animate-spin" /> Generating your week...</>
                : <><CalendarDays size={16} /> Generate Week Plan</>}
            </button>
          </div>

          {/* ── Results panel ── */}
          <div>
            {!result && !generating && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6 rounded-2xl"
                style={{ border: '1px dashed rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.02)' }}>
                <CalendarDays size={36} className="text-muted mb-4" />
                <p className="text-sm font-medium text-muted">Your weekly content plan will appear here</p>
                <p className="text-xs text-zinc-600 mt-1">Enter a topic and click Generate</p>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <Sparkles size={28} className="text-amber" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl animate-pulse"
                    style={{ border: '1px solid rgba(139,92,246,0.3)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-heading">Creating your week plan</p>
                  <p className="text-xs text-muted mt-1">Crafting 7 unique angles across all platforms...</p>
                </div>
              </div>
            )}

            {result && (
              <WeekCalendar
                plan={result.weekPlan}
                planId={result.planId}
                strategyNote={result.strategyNote}
                onSchedule={handleSchedule}
                scheduling={scheduling}
              />
            )}
          </div>
        </div>
      )}
    </PageTransition>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '139, 92, 246'
}
