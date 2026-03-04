import { useState, useEffect } from 'react'
import { LayoutTemplate, ArrowRight, Lock, Sparkles, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { listTemplates } from '@/services/templates'
import { useUsage } from '@/contexts/UsageContext'
import { TemplatePreviewModal } from './TemplatePreviewModal'
import { PLATFORM_MAP } from './constants'

// ── Tier helpers ───────────────────────────────────────────────────────────────
const PLAN_RANK = { free: 0, starter: 1, pro: 2 }

function isAccessible(plan, templateTier) {
  return (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[templateTier ?? 'free'] ?? 0)
}

const TIER_BADGE = {
  starter: { label: 'Starter', color: '#f59e0b', Icon: Sparkles },
  pro:     { label: 'Pro',     color: '#a78bfa', Icon: Star },
}

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  career:    { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  text: '#a78bfa' },
  project:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa' },
  tutorial:  { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   text: '#4ade80' },
  opinion:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   text: '#f87171' },
  milestone: { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24' },
  custom:    { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' },
}

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.custom
}

// ── Ghost skeleton ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-44 rounded-xl border border-border bg-surface-2 p-3 animate-pulse">
      <div className="h-4 w-16 rounded bg-border mb-2" />
      <div className="h-3.5 w-32 rounded bg-border mb-1" />
      <div className="h-3 w-28 rounded bg-border/60 mt-1" />
      <div className="h-3 w-12 rounded bg-border/40 mt-3" />
    </div>
  )
}

// ── Template card ──────────────────────────────────────────────────────────────
function TemplateCard({ template, plan, onClick, onPreview }) {
  const [hovered, setHovered] = useState(false)
  const cc = getCategoryColor(template.category)
  const locked = !isAccessible(plan, template.tier)
  const tierBadge = TIER_BADGE[template.tier]

  function handleClick() {
    if (locked) {
      onPreview(template)
    } else {
      onClick(template)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 w-44 rounded-xl border text-left p-3 cursor-pointer relative overflow-hidden"
      style={{
        background: locked
          ? 'rgba(255,255,255,0.015)'
          : hovered ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
        borderColor: locked
          ? 'rgba(30,30,46,0.7)'
          : hovered ? 'rgba(139,92,246,0.35)' : 'rgba(30,30,46,1)',
        boxShadow: (!locked && hovered)
          ? '0 4px 16px rgba(139,92,246,0.12), 0 0 0 1px rgba(139,92,246,0.2)'
          : 'none',
        opacity: locked ? 0.7 : 1,
        transform: (!locked && hovered) ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top row: category badge + tier badge */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span
          className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
          style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.text }}
        >
          {template.category}
        </span>
        {tierBadge && (
          <span
            className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
            style={{ color: tierBadge.color, background: `${tierBadge.color}15`, border: `1px solid ${tierBadge.color}30` }}
          >
            {locked ? <Lock size={7} /> : <tierBadge.Icon size={7} />}
            {tierBadge.label}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-heading leading-snug line-clamp-2 mb-1">
        {template.name}
      </p>

      {/* Description */}
      {template.description && (
        <p className="text-[10px] text-muted leading-relaxed line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Footer: platform dots + use count */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1">
          {(template.platforms ?? []).slice(0, 4).map((p) => {
            const cfg = PLATFORM_MAP[p]
            if (!cfg) return null
            return (
              <div
                key={p}
                title={cfg.label}
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: cfg.color, opacity: locked ? 0.5 : 1 }}
              />
            )
          })}
        </div>
        {template.use_count > 0 && (
          <span className="text-[9px] text-muted/60">
            {template.use_count}×
          </span>
        )}
      </div>

      {/* Lock overlay hint */}
      {locked && (
        <div
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-4.5 h-4.5"
        >
          <Lock size={10} className="text-muted/60" />
        </div>
      )}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function TemplateRow({ onSelectTemplate, onUpgrade }) {
  const { plan } = useUsage()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState(null)

  useEffect(() => {
    listTemplates()
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Don't render the section at all if there's nothing to show
  if (!loading && templates.length === 0) return null

  return (
    <div className="mb-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber/10 border border-amber/20">
          <LayoutTemplate size={12} className="text-amber" />
        </div>
        <span className="text-xs font-semibold text-heading">Templates</span>
        <div className="flex-1 h-px bg-border" />
        <Link
          to="/templates"
          className="flex items-center gap-1 text-[10px] text-muted hover:text-amber transition-colors"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      {/* Scroll row */}
      <div
        className="flex gap-2.5 overflow-x-auto py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                plan={plan}
                onClick={onSelectTemplate}
                onPreview={setPreviewTemplate}
              />
            ))
        }
      </div>

      {/* Preview modal for locked templates */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUpgrade={(tier) => {
          setPreviewTemplate(null)
          onUpgrade?.(tier)
        }}
      />
    </div>
  )
}
