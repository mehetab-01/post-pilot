import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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
  const [instanceUrl, setInstanceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isConnected = connection?.connected

  async function handleConnect(e) {
    e.preventDefault()
    const instance = instanceUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!instance) return

    setLoading(true)
    setError(null)
    try {
      const redirectUrl = await authorizeMastodon(instance)
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
      <div>
        <label className="block text-xs text-muted mb-1.5">Mastodon Instance</label>
        <input
          type="text"
          value={instanceUrl}
          onChange={(e) => setInstanceUrl(e.target.value)}
          placeholder="mastodon.social"
          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-border text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-[#6364ff]/50 transition-colors"
        />
      </div>

      {/* Quick-pick buttons */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_INSTANCES.map((inst) => (
          <button
            key={inst}
            type="button"
            onClick={() => setInstanceUrl(inst)}
            className="px-2.5 py-1 rounded-lg text-[11px] border border-border text-muted hover:text-text hover:border-zinc-600 transition-colors"
          >
            {inst}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-900/60 bg-red-950/40 text-xs text-danger">
          <XCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !instanceUrl.trim()}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#6364ff] text-white hover:bg-[#5253ee] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Connect to Mastodon
      </button>
    </form>
  )
}
