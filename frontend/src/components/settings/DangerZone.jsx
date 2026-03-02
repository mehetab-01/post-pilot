import { useState } from 'react'
import { Trash2, Download, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { exportData } from '@/services/settings'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

// ── Confirm modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, isLoading }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-[400px] rounded-2xl border border-red-900/50 overflow-hidden pointer-events-auto"
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
                <h2 className="flex-1 text-sm font-semibold text-heading">Delete account?</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <p className="text-sm text-text leading-relaxed mb-2">
                  This will permanently delete your account and all associated data, including:
                </p>
                <ul className="text-xs text-muted space-y-1 mb-4 ml-3 list-disc">
                  <li>All generated posts and history</li>
                  <li>Saved API keys (encrypted)</li>
                  <li>Account credentials</li>
                </ul>
                <p className="text-xs text-danger font-medium">This action cannot be undone.</p>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-text hover:border-zinc-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger/10 border border-danger/40 text-sm font-semibold text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Delete my account
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
      // Backend endpoint not yet implemented — show clear message
      toast.error('Delete account requires a backend endpoint (not yet implemented)')
      setShowModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Delete failed')
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
