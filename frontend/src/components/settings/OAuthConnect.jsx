import { useState } from 'react'
import { CheckCircle2, Link2, Unlink, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

/**
 * Renders a "Connect with [Platform]" card for OAuth-based social platforms.
 * Props:
 *   platform   — "linkedin" | "reddit"
 *   Icon       — lucide/react-icons icon component
 *   label      — "LinkedIn" | "Reddit"
 *   color      — brand hex color
 *   connection — { connected: bool, username: string|null } from API
 *   onConnect  — async () => void  (calls authorize endpoint, does redirect)
 *   onDisconnect — async () => void
 */
export function OAuthConnect({
  platform,
  Icon,
  label,
  color,
  connection,
  onConnect,
  onDisconnect,
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleConnect() {
    setIsLoading(true)
    try {
      await onConnect()
    } catch (err) {
      toast.error(err?.response?.data?.detail || `Failed to start ${label} OAuth`)
      setIsLoading(false)
    }
    // Note: page redirects so setIsLoading(false) may not be reached on success
  }

  async function handleDisconnect() {
    setIsLoading(true)
    try {
      await onDisconnect()
      toast.success(`${label} disconnected`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || `Failed to disconnect ${label}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (connection?.connected) {
    return (
      <div
        className="flex items-center justify-between p-4 rounded-xl border"
        style={{ borderColor: `${color}30`, background: `${color}08` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}20`, border: `1px solid ${color}35` }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-green-400" />
              <span className="text-sm font-medium text-heading">Connected</span>
            </div>
            <p className="text-xs text-muted mt-0.5">{connection.username || label}</p>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-danger hover:border-red-800/50 hover:bg-red-900/10 transition-all disabled:opacity-50"
        >
          <Unlink size={12} />
          {isLoading ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 opacity-50"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-medium text-text">Not connected</p>
          <p className="text-xs text-muted mt-0.5">
            Click to authorize via {label}&apos;s official OAuth
          </p>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
          'disabled:opacity-50 hover:brightness-110 active:scale-[0.97]',
        )}
        style={{
          background: color,
          color: '#fff',
          boxShadow: `0 0 12px ${color}30`,
        }}
      >
        <Link2 size={13} />
        {isLoading ? 'Redirecting…' : `Connect ${label}`}
      </button>
    </div>
  )
}
