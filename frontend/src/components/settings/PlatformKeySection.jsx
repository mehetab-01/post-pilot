import { useState } from 'react'
import { ChevronDown, CheckCircle2, XCircle, ExternalLink, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { KeyInput } from './KeyInput'
import { SetupGuide } from './SetupGuide'
import { ConnectionStatus } from './ConnectionStatus'
import { OAuthConnect } from './OAuthConnect'
import { saveKeys, testConnection } from '@/services/settings'
import { getAuthorizeUrl, disconnectPlatform } from '@/services/oauth'

// ── Inline info card ───────────────────────────────────────────────────────────
function InfoCard({ text }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-zinc-900/60">
      <Info size={14} className="text-muted mt-0.5 flex-shrink-0" />
      <p className="text-xs text-muted leading-relaxed">{text}</p>
    </div>
  )
}

// ── Test result banner ─────────────────────────────────────────────────────────
function TestResult({ result }) {
  if (!result) return null
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border',
        result.success
          ? 'bg-green-950/40 border-green-900/60 text-green-400'
          : 'bg-red-950/40 border-red-900/60 text-danger',
      )}
    >
      {result.success
        ? <CheckCircle2 size={13} className="flex-shrink-0" />
        : <XCircle size={13} className="flex-shrink-0" />}
      {result.message}
    </div>
  )
}

// ── Instagram info-only section ────────────────────────────────────────────────
function InstagramSection({ config, savedKeys, onSave }) {
  const [open, setOpen] = useState(false)
  const [draftValues, setDraftValues] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = Object.values(draftValues).some((v) => v.trim() !== '')
  const hasSaved = savedKeys && Object.keys(savedKeys).length > 0

  async function handleSave() {
    const keysToSend = Object.fromEntries(
      Object.entries(draftValues).filter(([, v]) => v.trim() !== ''),
    )
    if (!Object.keys(keysToSend).length) return
    setIsSaving(true)
    try {
      await saveKeys(config.id, keysToSend)
      setDraftValues({})
      toast.success('Instagram keys saved')
      onSave?.(config.id)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <SectionHeader
        config={config}
        status={config.fixedStatus}
        isOpen={open}
        onToggle={() => setOpen((v) => !v)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-2 flex flex-col gap-4">
              <InfoCard text={config.infoCard} />

              {config.advancedKeys?.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors mb-4"
                  >
                    <ChevronDown size={13} />
                    Advanced: Meta Business API (optional)
                  </button>

                  <div className="flex flex-col gap-3">
                    {config.advancedKeys.map((key) => (
                      <KeyInput
                        key={key.name}
                        {...key}
                        value={draftValues[key.name] ?? ''}
                        onChange={(name, val) =>
                          setDraftValues((p) => ({ ...p, [name]: val }))
                        }
                        hasSavedValue={!!savedKeys?.[key.name]}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <ActionButton
                      onClick={handleSave}
                      disabled={!isDirty || isSaving}
                      loading={isSaving}
                      variant="primary"
                    >
                      Save
                    </ActionButton>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── WhatsApp info-only section ─────────────────────────────────────────────────
function WhatsAppSection({ config }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <SectionHeader
        config={config}
        status={config.fixedStatus}
        isOpen={open}
        onToggle={() => setOpen((v) => !v)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-2">
              <InfoCard text={config.infoCard} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Shared section header ──────────────────────────────────────────────────────
function SectionHeader({ config, status, isOpen, onToggle }) {
  const { Icon, color, rgb, label, desc, required } = config

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-2/50 transition-colors text-left"
    >
      {/* Platform icon */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
        style={{
          background: `rgba(${rgb},0.12)`,
          border: `1px solid rgba(${rgb},0.25)`,
        }}
      >
        <Icon size={15} style={{ color }} />
      </div>

      {/* Name + desc */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-heading">{label}</span>
          {required && (
            <Badge variant="amber">Required</Badge>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{desc}</p>
      </div>

      {/* Status + chevron */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <ConnectionStatus status={status} />
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-muted"
        >
          <ChevronDown size={15} />
        </motion.span>
      </div>
    </button>
  )
}

// ── Action button (avoid importing the full Button component to stay lightweight) ──
function ActionButton({ children, onClick, disabled, loading, variant = 'primary' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-amber text-white hover:bg-amber-light active:scale-[0.98]'
          : 'border border-border text-muted hover:text-text hover:border-zinc-600',
      )}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

// ── OAuth section (LinkedIn, Reddit) ─────────────────────────────────────────
function OAuthSection({ config, connection, onConnectionChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const status = connection?.connected ? 'connected' : 'none'

  async function handleConnect() {
    const url = await getAuthorizeUrl(config.id)
    window.location.href = url
  }

  async function handleDisconnect() {
    await disconnectPlatform(config.id)
    onConnectionChange?.(config.id, { connected: false, username: null })
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <SectionHeader
        config={config}
        status={status}
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-3 flex flex-col gap-4 border-t border-border">
              <OAuthConnect
                platform={config.id}
                Icon={config.Icon}
                label={config.label}
                color={config.color}
                connection={connection}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
              {config.note && (
                <p className="text-[11px] text-muted/80 italic leading-relaxed">{config.note}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main section (with key inputs) ────────────────────────────────────────────
export function PlatformKeySection({ config, savedKeys, testResult, oauthConnections, onSave, onTest, onConnectionChange }) {
  // Route info-only variants
  if (config.id === 'instagram') {
    return (
      <InstagramSection config={config} savedKeys={savedKeys} onSave={onSave} />
    )
  }
  if (config.id === 'whatsapp') {
    return <WhatsAppSection config={config} />
  }
  // Route OAuth variants
  if (config.oauthType) {
    return (
      <OAuthSection
        config={config}
        connection={oauthConnections?.[config.id]}
        onConnectionChange={onConnectionChange}
      />
    )
  }

  const [isOpen, setIsOpen]           = useState(config.required)
  const [draftValues, setDraftValues] = useState({})
  const [isSaving, setIsSaving]       = useState(false)
  const [isTesting, setIsTesting]     = useState(false)
  const [localTest, setLocalTest]     = useState(null)

  const hasSavedKeys = savedKeys && Object.keys(savedKeys).length > 0
  const isDirty      = Object.values(draftValues).some((v) => v.trim() !== '')

  const status = (testResult ?? localTest)?.success
    ? 'connected'
    : hasSavedKeys ? 'saved' : 'none'

  function handleChange(name, val) {
    setDraftValues((p) => ({ ...p, [name]: val }))
  }

  async function handleSave() {
    const keysToSend = Object.fromEntries(
      Object.entries(draftValues).filter(([, v]) => v.trim() !== ''),
    )
    if (!Object.keys(keysToSend).length) return

    setIsSaving(true)
    try {
      await saveKeys(config.id, keysToSend)
      setDraftValues({})
      setLocalTest(null)
      toast.success(`${config.label} keys saved`)
      onSave?.(config.id)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTest() {
    setIsTesting(true)
    setLocalTest(null)
    try {
      const res = await testConnection(config.id)
      const result = { success: true, message: res.message ?? 'Connection successful' }
      setLocalTest(result)
      onTest?.(config.id, true)
      toast.success(`${config.label} connected!`)
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Connection failed'
      setLocalTest({ success: false, message: msg })
      onTest?.(config.id, false)
    } finally {
      setIsTesting(false)
    }
  }

  const activeTestResult = localTest ?? (testResult ? { success: testResult.success, message: testResult.message } : null)

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <SectionHeader
        config={config}
        status={status}
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 pt-2 flex flex-col gap-4 border-t border-border">
              {/* Helper link */}
              {config.helperLink && (
                <p className="text-xs text-muted">
                  {config.helperText}{' '}
                  <a
                    href={config.helperLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber hover:underline"
                  >
                    {config.helperLink.text}
                    <ExternalLink size={11} />
                  </a>
                </p>
              )}

              {/* Key inputs */}
              <div className="flex flex-col gap-3">
                {config.keys.map((key) => (
                  <KeyInput
                    key={key.name}
                    {...key}
                    value={draftValues[key.name] ?? ''}
                    onChange={handleChange}
                    hasSavedValue={!!savedKeys?.[key.name]}
                  />
                ))}
              </div>

              {/* Setup guide */}
              {config.guide && <SetupGuide steps={config.guide} />}

              {/* Platform note */}
              {config.note && (
                <p className="text-[11px] text-muted/80 italic leading-relaxed">{config.note}</p>
              )}

              {/* Test result */}
              <TestResult result={activeTestResult} />

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <ActionButton
                  onClick={handleSave}
                  disabled={!isDirty}
                  loading={isSaving}
                  variant="primary"
                >
                  Save
                </ActionButton>
                <ActionButton
                  onClick={handleTest}
                  disabled={!hasSavedKeys}
                  loading={isTesting}
                  variant="ghost"
                >
                  Test Connection
                </ActionButton>
                {!hasSavedKeys && (
                  <span className="text-xs text-muted">Save keys first to test</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
