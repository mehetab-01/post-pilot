import { useState } from 'react'
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { connectBluesky } from '@/services/oauth'
import { disconnectPlatform } from '@/services/oauth'

export function BlueskyConnect({ connection, onConnectionChange }) {
  const [handle, setHandle] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isConnected = connection?.connected

  async function handleConnect(e) {
    e.preventDefault()
    if (!handle.trim() || !appPassword.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await connectBluesky(handle.trim(), appPassword.trim())
      toast.success(`Connected as @${res.username.replace(/^@/, '')}`)
      onConnectionChange?.('bluesky', { connected: true, username: res.username })
      setHandle('')
      setAppPassword('')
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Failed to connect to Bluesky'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectPlatform('bluesky')
      onConnectionChange?.('bluesky', { connected: false, username: null })
      toast.success('Bluesky disconnected')
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
        <label className="block text-xs text-muted mb-1.5">Bluesky Handle</label>
        <div className="flex items-center gap-0 rounded-xl bg-zinc-900 border border-border focus-within:border-[#0085ff]/50 transition-colors overflow-hidden">
          <span className="px-3 py-2 text-sm text-muted/70 select-none">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/^@+/, ''))}
            placeholder="yourname.bsky.social"
            className="flex-1 px-3 py-2 bg-transparent text-sm text-text placeholder:text-muted/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1.5">App Password</label>
        <input
          type="password"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          placeholder="xxxx-xxxx-xxxx-xxxx"
          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-border text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-[#0085ff]/50 transition-colors"
        />
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted/80">
        <ExternalLink size={11} />
        <a
          href="https://bsky.app/settings/app-passwords"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text transition-colors underline underline-offset-2"
        >
          Create an app password at bsky.app
        </a>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-900/60 bg-red-950/40 text-xs text-danger">
          <XCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !handle.trim() || !appPassword.trim()}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0085ff] text-white hover:bg-[#0073e6] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Connect to Bluesky
      </button>
    </form>
  )
}
