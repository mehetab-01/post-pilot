import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import {
  LayoutTemplate, Plus, Pencil, Trash2, Flame, Check, X, Lock, Sparkles, Star,
} from 'lucide-react'
import { clsx } from 'clsx'
import { PageTransition } from '@/components/layout/PageTransition'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PLATFORM_MAP } from '@/components/dashboard/constants'
import { TemplatePreviewModal } from '@/components/dashboard/TemplatePreviewModal'
import { useUsage } from '@/contexts/UsageContext'
import {
  listTemplates, createTemplate, updateTemplate, deleteTemplate, useTemplate,
} from '@/services/templates'

// ── Tier / plan helpers ────────────────────────────────────────────────────────
const PLAN_RANK = { free: 0, starter: 1, pro: 2 }

function isAccessible(plan, templateTier) {
  return (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[templateTier ?? 'free'] ?? 0)
}

const TIER_BADGE = {
  starter: { label: 'Starter', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Sparkles },
  pro:     { label: 'Pro',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', Icon: Star },
}

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',       label: 'All' },
  { value: 'career',    label: 'Career' },
  { value: 'project',   label: 'Project' },
  { value: 'tutorial',  label: 'Tutorial' },
  { value: 'opinion',   label: 'Opinion' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'custom',    label: 'Custom' },
]

const TIER_FILTERS = [
  { value: 'all',     label: 'All tiers' },
  { value: 'free',    label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro',     label: 'Pro' },
]

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

// ── Template form (create / edit) ──────────────────────────────────────────────
const FORM_CATEGORIES = CATEGORIES.filter((c) => c.value !== 'all')

function TemplateFormModal({ open, onClose, initial, onSaved }) {
  const [name, setName]         = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'custom')
  const [description, setDesc]  = useState(initial?.description ?? '')
  const [context, setContext]   = useState(initial?.context_template ?? '')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setCategory(initial?.category ?? 'custom')
      setDesc(initial?.description ?? '')
      setContext(initial?.context_template ?? '')
    }
  }, [open, initial])

  async function handleSubmit() {
    if (!name.trim()) return toast.error('Name is required')
    if (!context.trim()) return toast.error('Context template is required')
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        context_template: context.trim(),
      }
      const result = initial?.id
        ? await updateTemplate(initial.id, payload)
        : await createTemplate(payload)
      toast.success(initial?.id ? 'Template updated!' : 'Template created!')
      onSaved(result)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={initial?.id ? 'Edit Template' : 'New Template'}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Career Update, Project Launch…"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:outline-none focus:border-amber/50 transition-colors"
          >
            {FORM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="When to use this template…"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text">Context template</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={5}
            placeholder="Use {{placeholders}} for dynamic parts, e.g. {{company}}, {{achievement}}…"
            className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-amber/50 transition-colors font-mono"
          />
          <p className="text-[11px] text-muted">Use {'{{double braces}}'} for placeholders users will fill in.</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted border border-border hover:text-text hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber/90 transition-colors"
          >
            {saving ? 'Saving…' : (initial?.id ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete confirm modal ───────────────────────────────────────────────────────
function DeleteModal({ open, name, onClose, onConfirm, deleting }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Delete Template" size="sm">
      <p className="text-sm text-muted mb-6">
        Delete <span className="text-heading font-semibold">"{name}"</span>? This cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-muted border border-border hover:text-text hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

// ── Template grid card ─────────────────────────────────────────────────────────
function TemplateGridCard({ template, plan, onUse, onEdit, onDelete, onPreview }) {
  const [using, setUsing] = useState(false)
  const cc = getCategoryColor(template.category)
  const isBuiltIn = template.user_id === null
  const locked = !isAccessible(plan, template.tier)
  const tierBadge = TIER_BADGE[template.tier]

  const platforms = template.platforms ?? []

  async function handleUse() {
    if (locked) { onPreview(template); return }
    setUsing(true)
    try {
      await onUse(template)
    } finally {
      setUsing(false)
    }
  }

  return (
    <div
      className={clsx(
        'flex flex-col rounded-2xl border bg-surface transition-colors p-5 gap-3 relative overflow-hidden',
        locked ? 'opacity-80' : 'hover:border-border/80',
      )}
      style={locked ? { borderColor: 'rgba(255,255,255,0.05)' } : undefined}
    >
      {/* Accent left border from template color */}
      {template.color && (
        <div
          className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
          style={{ background: template.color, opacity: locked ? 0.3 : 0.7 }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.text }}
          >
            {template.category}
          </span>
          {isBuiltIn && (
            <span className="text-[10px] text-muted border border-border rounded-md px-2 py-0.5 flex items-center gap-1">
              <Flame size={9} className="text-amber" /> Built-in
            </span>
          )}
          {tierBadge && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                color: tierBadge.color,
                background: tierBadge.bg,
                border: `1px solid ${tierBadge.border}`,
              }}
            >
              {locked ? <Lock size={8} /> : <tierBadge.Icon size={8} />}
              {tierBadge.label}
            </span>
          )}
        </div>

        {/* Own template actions (not locked built-ins) */}
        {!isBuiltIn && !locked && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit(template)}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(template)}
              className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-heading leading-snug">{template.name}</h3>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-muted leading-relaxed">{template.description}</p>
      )}

      {/* Context preview (blurred if locked) */}
      <div className="relative overflow-hidden rounded-lg">
        <p
          className="text-xs text-muted/70 font-mono leading-relaxed line-clamp-3 bg-surface-2 px-3 py-2 border border-border/50"
          style={locked ? { filter: 'blur(3px)', userSelect: 'none' } : undefined}
        >
          {template.context_template}
        </p>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/90 border border-border/60">
              <Lock size={10} className="text-muted" />
              <span className="text-[10px] text-muted font-medium">
                {tierBadge?.label ?? 'Premium'} only
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Platform pills */}
      {platforms.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {platforms.map((p) => {
            const cfg = PLATFORM_MAP[p]
            if (!cfg) return null
            return (
              <span
                key={p}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md"
                style={{
                  background: `rgba(${cfg.rgb},0.12)`,
                  color: cfg.color,
                  border: `1px solid rgba(${cfg.rgb},0.25)`,
                  opacity: locked ? 0.5 : 1,
                }}
              >
                <cfg.Icon size={9} />
                {cfg.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <span className="text-[10px] text-muted">
          {template.use_count > 0 ? `Used ${template.use_count}×` : 'Never used'}
        </span>
        <button
          type="button"
          onClick={handleUse}
          disabled={using}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50',
            locked
              ? 'bg-surface-2 border border-border text-muted hover:text-text'
              : 'bg-amber/10 border border-amber/25 text-amber hover:bg-amber/20',
          )}
        >
          {using
            ? <span className="w-3 h-3 border border-amber border-t-transparent rounded-full animate-spin" />
            : locked ? <Lock size={11} /> : <Check size={11} />
          }
          {locked ? `Unlock ${tierBadge?.label ?? ''}` : 'Use Template'}
        </button>
      </div>
    </div>
  )
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
function SkeletonGridCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse flex flex-col gap-3">
      <div className="h-4 w-20 rounded bg-border" />
      <div className="h-4 w-40 rounded bg-border" />
      <div className="h-3 w-full rounded bg-border/60" />
      <div className="h-16 w-full rounded-lg bg-border/40" />
      <div className="h-3 w-32 rounded bg-border/40 mt-auto" />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Templates() {
  const navigate = useNavigate()
  const { plan } = useUsage()
  const [templates, setTemplates]   = useState([])
  const [activeCategory, setActive] = useState('all')
  const [activeTier, setActiveTier] = useState('all')
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDelete]   = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const cardsRef = useRef([])

  useEffect(() => { document.title = 'Templates | PostPilot' }, [])

  const fetchTemplates = useCallback((cat = activeCategory) => {
    setLoading(true)
    listTemplates(cat === 'all' ? null : cat)
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeCategory])

  useEffect(() => { fetchTemplates(activeCategory) }, [activeCategory])

  // Stagger cards after load
  useEffect(() => {
    if (loading) return
    const els = cardsRef.current.filter(Boolean)
    if (!els.length) return
    gsap.fromTo(
      els,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.05 },
    )
  }, [loading, activeCategory])

  async function handleUse(template) {
    const data = await useTemplate(template.id)
    navigate('/dashboard', { state: { template: data } })
  }

  function handleSaved(result) {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === result.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = result
        return next
      }
      return [result, ...prev]
    })
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTemplate(deleteTarget.id)
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      toast.success('Template deleted')
      setDelete(null)
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  // Client-side tier filter
  const displayedTemplates = activeTier === 'all'
    ? templates
    : templates.filter((t) => (t.tier ?? 'free') === activeTier)

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Content</p>
            <h1
              className="text-3xl font-bold text-heading mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Templates
            </h1>
            <p className="text-muted text-sm max-w-lg leading-relaxed">
              Reusable post formats with placeholders. Click a template to pre-fill
              the Dashboard context and auto-select platforms and tones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber text-white hover:bg-amber/90 transition-colors flex-shrink-0 mt-1"
          >
            <Plus size={15} /> New Template
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActive(cat.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  activeCategory === cat.value
                    ? 'bg-amber/15 border border-amber/30 text-amber'
                    : 'text-muted border border-transparent hover:text-text hover:bg-surface-2',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TIER_FILTERS.map((t) => {
              const tierBadge = TIER_BADGE[t.value]
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setActiveTier(t.value)}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 border',
                    activeTier === t.value
                      ? 'border-white/15 bg-white/[0.06] text-text'
                      : 'border-transparent text-muted hover:text-text hover:bg-surface-2',
                  )}
                  style={
                    activeTier === t.value && tierBadge
                      ? { borderColor: tierBadge.border, background: tierBadge.bg, color: tierBadge.color }
                      : undefined
                  }
                >
                  {tierBadge && (activeTier === t.value
                    ? <tierBadge.Icon size={9} />
                    : <tierBadge.Icon size={9} className="opacity-50" style={{ color: tierBadge.color }} />
                  )}
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonGridCard key={i} />)}
          </div>
        ) : displayedTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
              <LayoutTemplate size={22} className="text-muted" />
            </div>
            <p className="text-sm font-medium text-heading">No templates yet</p>
            <p className="text-xs text-muted max-w-xs">
              {activeCategory === 'all'
                ? 'Create your first template or use the Dashboard to save a post context.'
                : `No ${activeCategory} templates yet. Create one or switch category.`}
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber/10 border border-amber/25 text-amber hover:bg-amber/20 transition-colors"
            >
              <Plus size={12} /> New Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedTemplates.map((t, i) => (
              <div key={t.id} ref={(el) => { cardsRef.current[i] = el }}>
                <TemplateGridCard
                  template={t}
                  plan={plan}
                  onUse={handleUse}
                  onEdit={(tpl) => setEditTarget(tpl)}
                  onDelete={(tpl) => setDelete(tpl)}
                  onPreview={setPreviewTemplate}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <TemplateFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        initial={null}
        onSaved={handleSaved}
      />

      {/* Edit modal */}
      <TemplateFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget}
        onSaved={handleSaved}
      />

      {/* Delete confirm modal */}
      <DeleteModal
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ''}
        onClose={() => setDelete(null)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />

      {/* Tier preview modal */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUpgrade={(tier) => {
          setPreviewTemplate(null)
          // Navigate to pricing / settings — for now, show a toast
          toast(`Upgrade to ${tier === 'pro' ? 'Pro' : 'Starter'} to use this template`, { icon: '✨' })
        }}
      />
    </PageTransition>
  )
}
