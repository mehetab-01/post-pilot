import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { authorizeMastodon, disconnectPlatform } from '@/services/oauth'

const POPULAR_INSTANCES = [
  'mastodon.social',
  'fosstodon.org',
  'hachyderm.io',
  'mas.to',
  'mstdn.social',
  'infosec.exchange',
]

export function MastodonConnect({ connection, onConnectionChange }) {
  const [username, setUsername]   = useState('')   // e.g. "tabcrypt"
  const [instance, setInstance]   = useState('')   // e.g. "mastodon.social"
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const isConnected = connection?.connected

  // Full handle sent to backend — backend already parses @user@instance format
  const fullHandle = username.trim() && instance ? `${username.trim()}@${instance}` : instance

  const hasUsername = username.trim().length > 0
  const canSubmit   = hasUsername && instance.length > 0

  function handleInstancePick(inst) {
    setInstance(inst)
    setError(null)
  }

  async function handleConnect(e) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(null)
    try {
      const redirectUrl = await authorizeMastodon(fullHandle)
      window.location.href = redirectUrl
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Failed to connect to Mastodon instance'
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectPlatform('mastodon')
      onConnectionChange?.('mastodon', { connected: false, username: null })
      toast.success('Mastodon disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  if (isConnected) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-green-900/60 bg-green-950/40">
          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400 font-medium">
            Connected as @{(connection.username || '').replace(/^@/, '')}
            {connection.instance_url && (
              <span className="text-green-400/70"> on {connection.instance_url}</span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="self-start text-xs text-muted hover:text-danger transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleConnect} className="flex flex-col gap-3">
      {/* Username input */}
      <div>
        <label className="block text-xs text-muted mb-1.5">Your Mastodon Username</label>
        <div className="flex items-center gap-0 rounded-xl bg-zinc-900 border border-border focus-within:border-[#6364ff]/50 transition-colors overflow-hidden">
          <span className="px-3 py-2 text-sm text-muted/70 select-none border-r border-border">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[@\s]/g, ''))}
            placeholder="yourname"
            className="flex-1 px-3 py-2 bg-transparent text-sm text-text placeholder:text-muted/50 focus:outline-none"
          />
          {username && instance && (
            <span className="px-3 py-2 text-xs text-muted/60 select-none truncate max-w-[140px]">
              @{instance}
            </span>
          )}
        </div>
      </div>

      {/* Instance picker */}
      <div>
        <label className="block text-xs text-muted mb-1.5 flex items-center gap-1.5">
          {hasUsername && !instance
            ? <><ArrowDown size={11} className="text-[#6364ff]" /> Now pick your instance</>
            : 'Instance'
          }
        </label>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_INSTANCES.map((inst) => (
            <button
              key={inst}
              type="button"
              disabled={!hasUsername}
              onClick={() => handleInstancePick(inst)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all
                ${instance === inst
                  ? 'border-[#6364ff] bg-[#6364ff]/10 text-[#6364ff]'
                  : hasUsername
                    ? 'border-border text-muted hover:text-text hover:border-zinc-600 cursor-pointer'
                    : 'border-border/40 text-muted/30 cursor-not-allowed'
                }`}
            >
              {inst}
            </button>
          ))}
        </div>
        {!hasUsername && (
          <p className="text-[11px] text-muted/50 mt-1.5">Type your username above to enable instance selection</p>
        )}
      </div>

      {/* Preview */}
      {canSubmit && (
        <p className="text-[11px] text-muted/70">
          Connecting as <span className="text-[#6364ff] font-medium">@{username}@{instance}</span>
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-900/60 bg-red-950/40 text-xs text-danger">
          <XCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#6364ff] text-white hover:bg-[#5253ee] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Connect to Mastodon
      </button>
    </form>
  )
}
