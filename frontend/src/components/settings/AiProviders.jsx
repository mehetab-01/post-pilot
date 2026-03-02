import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  Eye, EyeOff, ToggleLeft, ToggleRight, Sparkles, Zap,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { FaBrain } from 'react-icons/fa'
import { SiOpenai, SiGooglegemini } from 'react-icons/si'
import {
  getAiProviders,
  addAiProvider,
  updateAiProvider,
  reorderAiProviders,
  deleteAiProvider,
} from '@/services/aiProviders'

// ── Provider meta ──────────────────────────────────────────────────────────────
export const PROVIDER_META = {
  claude: {
    label: 'Claude (Anthropic)',
    Icon: FaBrain,
    color: '#f59e0b',
    placeholder: 'sk-ant-api03-…',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (recommended)' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fast)' },
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6 (most capable)' },
    ],
  },
  openai: {
    label: 'OpenAI',
    Icon: SiOpenai,
    color: '#10a37f',
    placeholder: 'sk-…',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (recommended)' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
  },
  groq: {
    label: 'Groq',
    Icon: Zap,
    color: '#f55036',
    placeholder: 'gsk_…',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (recommended)' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (fast)' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
  },
  gemini: {
    label: 'Gemini (Google)',
    Icon: SiGooglegemini,
    color: '#4285f4',
    placeholder: 'AIza…',
    models: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (recommended)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
}

// ── Add form ───────────────────────────────────────────────────────────────────
function AddProviderForm({ onAdd, onCancel }) {
  const [provider, setProvider] = useState('claude')
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const meta = PROVIDER_META[provider]
  const defaultModel = meta.models[0].value

  async function handleSubmit(e) {
    e.preventDefault()
    if (!apiKey.trim()) { toast.error('API key is required'); return }
    setIsSaving(true)
    try {
      const entry = await addAiProvider({
        provider,
        label: label.trim() || meta.label,
        api_key: apiKey.trim(),
        model: model || defaultModel,
      })
      toast.success(`${meta.label} provider added`)
      onAdd(entry)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add provider')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      onSubmit={handleSubmit}
      className="overflow-hidden"
    >
      <div className="border border-amber/25 rounded-xl p-5 bg-amber/5 flex flex-col gap-4 mt-3">
        <p className="text-sm font-semibold text-heading">Add AI Provider</p>

        {/* Provider picker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(PROVIDER_META).map(([key, m]) => {
            const Ic = m.Icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setProvider(key); setModel('') }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                  provider === key
                    ? 'border-amber bg-amber/10 text-heading'
                    : 'border-border text-muted hover:border-zinc-600 hover:text-text',
                )}
              >
                <Ic size={14} style={{ color: m.color }} />
                {m.label.split(' ')[0]}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Custom label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={meta.label}
              className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:border-amber focus:outline-none"
            />
          </div>

          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Model</label>
            <select
              value={model || defaultModel}
              onChange={(e) => setModel(e.target.value)}
              className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:border-amber focus:outline-none"
            >
              {meta.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* API Key */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={meta.placeholder}
              autoComplete="off"
              required
              className="w-full px-3 py-2 pr-10 bg-surface-2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:border-amber focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-amber text-zinc-900 text-sm font-semibold hover:bg-amber-light transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Add Provider'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.form>
  )
}

// ── Single provider card ───────────────────────────────────────────────────────
function ProviderCard({ entry, index, total, onMoveUp, onMoveDown, onToggle, onDelete }) {
  const meta = PROVIDER_META[entry.provider] || {}
  const Icon = meta.Icon || Sparkles

  async function handleToggle() {
    try {
      await updateAiProvider(entry.id, { enabled: !entry.enabled })
      onToggle(entry.id, !entry.enabled)
    } catch {
      toast.error('Failed to update provider')
    }
  }

  async function handleDelete() {
    try {
      await deleteAiProvider(entry.id)
      onDelete(entry.id)
      toast.success('Provider removed')
    } catch {
      toast.error('Failed to delete provider')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border transition-colors',
        entry.enabled ? 'border-border bg-surface' : 'border-border/50 bg-surface/50 opacity-60',
      )}
    >
      {/* Priority badge */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: entry.enabled ? `${meta.color}20` : 'rgba(39,39,42,0.5)',
          color: entry.enabled ? meta.color : '#71717a',
          border: `1px solid ${entry.enabled ? meta.color + '40' : '#3f3f46'}`,
        }}
      >
        {index + 1}
      </div>

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${meta.color}15`,
          border: `1px solid ${meta.color}30`,
        }}
      >
        <Icon size={16} style={{ color: meta.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading truncate">{entry.label}</p>
        <p className="text-xs text-muted truncate">{entry.model} · {entry.masked_key}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Up/down */}
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up (higher priority)"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down (lower priority)"
        >
          <ChevronDown size={14} />
        </button>

        {/* Enable/disable toggle */}
        <button
          onClick={handleToggle}
          className={clsx(
            'p-1.5 rounded-lg transition-all',
            entry.enabled
              ? 'text-amber hover:bg-amber/10'
              : 'text-muted hover:text-text hover:bg-surface-2',
          )}
          title={entry.enabled ? 'Disable this provider' : 'Enable this provider'}
        >
          {entry.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-900/10 transition-all"
          title="Remove provider"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}

// ── Main AiProviders section ───────────────────────────────────────────────────
export function AiProviders() {
  const [providers, setProviders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    getAiProviders()
      .then(setProviders)
      .catch(() => toast.error('Failed to load AI providers'))
      .finally(() => setIsLoading(false))
  }, [])

  async function pushReorder(updated) {
    const items = updated.map((p, i) => ({ id: p.id, priority: i }))
    try {
      await reorderAiProviders(items)
    } catch {
      toast.error('Failed to save order')
    }
  }

  function moveUp(index) {
    if (index === 0) return
    const next = [...providers]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setProviders(next)
    pushReorder(next)
  }

  function moveDown(index) {
    if (index === providers.length - 1) return
    const next = [...providers]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setProviders(next)
    pushReorder(next)
  }

  function handleAdd(entry) {
    setProviders((prev) => [...prev, entry])
    setShowAdd(false)
  }

  function handleToggle(id, enabled) {
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, enabled } : p))
  }

  function handleDelete(id) {
    setProviders((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-heading">AI Providers</h3>
          <p className="text-xs text-muted mt-0.5">
            Add Claude, OpenAI, Groq, or Gemini. The order sets the fallback chain — if #1 fails, #2 is tried.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber text-zinc-900 text-xs font-semibold hover:bg-amber-light transition-colors"
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <AddProviderForm
            onAdd={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>

      {/* Provider list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl">
          <Sparkles size={28} className="text-muted mb-3" />
          <p className="text-sm font-medium text-muted">No AI providers yet</p>
          <p className="text-xs text-muted/70 mt-1">
            Add at least one provider to generate content
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="flex flex-col gap-2">
            {providers.map((entry, index) => (
              <ProviderCard
                key={entry.id}
                entry={entry}
                index={index}
                total={providers.length}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {providers.length > 1 && (
        <p className="text-xs text-muted text-center">
          <span className="text-amber">#{1}</span> = highest priority · tried first
        </p>
      )}
    </div>
  )
}
