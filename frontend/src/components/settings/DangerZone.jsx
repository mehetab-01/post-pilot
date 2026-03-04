import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Download, AlertTriangle, X } from 'lucide-react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { exportData } from '@/services/settings'
import { authApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const CONFIRM_PHRASE = 'delete my account'

// ── Confirm modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, isLoading }) {
  const [typed, setTyped] = useState('')
  const isMatch = typed.trim().toLowerCase() === CONFIRM_PHRASE

  // Reset input when modal opens/closes
  function handleClose() {
    setTyped('')
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-[440px] rounded-2xl border border-red-900/50 overflow-hidden pointer-events-auto"
              style={{
                background: 'rgba(24,24,27,0.98)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-950/50 border border-red-900/50 flex-shrink-0">
                  <AlertTriangle size={14} className="text-danger" />
                </div>
                <h2 className="flex-1 text-sm font-semibold text-heading">Delete account permanently?</h2>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 mb-4">
                  <p className="text-sm text-red-300 font-medium mb-2">
                    This action is irreversible. All your data will be permanently wiped:
                  </p>
                  <ul className="text-xs text-red-300/80 space-y-1.5 ml-3 list-disc">
                    <li>All generated posts and post history</li>
                    <li>Saved API keys and social connections</li>
                    <li>Templates, media uploads, and preferences</li>
                    <li>Subscription plan, billing history, and payment records</li>
                    <li>Your account credentials</li>
                  </ul>
                </div>

                <p className="text-sm text-text mb-3">
                  To confirm, type{' '}
                  <span className="font-mono text-danger font-semibold bg-red-950/40 px-1.5 py-0.5 rounded">
                    {CONFIRM_PHRASE}
                  </span>{' '}
                  below:
                </p>

                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  autoFocus
                  spellCheck={false}
                  className={clsx(
                    'w-full px-4 py-2.5 rounded-xl border text-sm bg-zinc-900 text-text',
                    'placeholder:text-muted/40 focus:outline-none transition-colors',
                    isMatch
                      ? 'border-danger/60 focus:border-danger'
                      : 'border-border focus:border-zinc-500',
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isMatch && !isLoading) onConfirm()
                  }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-text hover:border-zinc-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!isMatch || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger/10 border border-danger/40 text-sm font-semibold text-danger hover:bg-danger/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Delete forever
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DangerZone() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [showModal, setShowModal]   = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      await exportData()
      toast.success('Export downloaded')
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      await authApi.deleteAccount(CONFIRM_PHRASE)
      toast.success('Account deleted. Goodbye!')
      setShowModal(false)
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Delete failed — please try again')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-danger/25 bg-danger/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-danger/20">
          <AlertTriangle size={15} className="text-danger flex-shrink-0" />
          <h2 className="text-sm font-semibold text-heading">Danger Zone</h2>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-3">
          {/* Export data */}
          <div className="flex-1 flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface">
            <div>
              <p className="text-sm font-medium text-heading">Export data</p>
              <p className="text-xs text-muted mt-0.5">Download all post history as JSON</p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium',
                'text-muted hover:text-text hover:border-zinc-600 transition-colors flex-shrink-0',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isExporting ? (
                <span className="w-3.5 h-3.5 border border-current/40 border-t-current rounded-full animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Export
            </button>
          </div>

          {/* Delete account */}
          <div className="flex-1 flex items-center justify-between gap-4 p-4 rounded-xl border border-danger/20 bg-danger/5">
            <div>
              <p className="text-sm font-medium text-heading">Delete account</p>
              <p className="text-xs text-muted mt-0.5">Permanently remove all data</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-danger/40 bg-danger/10 text-xs font-medium text-danger hover:bg-danger/20 transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </>
  )
}
