import { clsx } from 'clsx'
import { Sparkles } from 'lucide-react'
import { PLATFORM_CONFIGS } from './configs'
import { ConnectionStatus } from './ConnectionStatus'

function deriveStatus(cfg, keysData, testResults, oauthConnections) {
  if (cfg.infoOnly) return cfg.fixedStatus
  if (cfg.oauthType) {
    return oauthConnections?.[cfg.id]?.connected ? 'connected' : 'none'
  }
  if (testResults?.[cfg.id]?.success) return 'connected'
  if (keysData?.[cfg.id] && Object.keys(keysData[cfg.id]).length > 0) return 'saved'
  return 'none'
}

export function StatusSidebar({ keysData, testResults, oauthConnections = {} }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium text-muted uppercase tracking-widest mb-3 px-1">
        Platform status
      </p>

      {/* AI Providers row */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber/5 border border-amber/15"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Sparkles size={11} className="text-amber" />
        </div>
        <span className="text-xs text-text font-medium flex-1 min-w-0 truncate">AI Providers</span>
        <ConnectionStatus status="saved" size="sm" />
      </div>

      {PLATFORM_CONFIGS.map((cfg) => {
        const status = deriveStatus(cfg, keysData, testResults, oauthConnections)
        const { Icon, color, rgb, label } = cfg

        return (
          <div
            key={cfg.id}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors duration-150',
              status === 'connected'
                ? 'bg-green-950/20 border border-green-900/30'
                : status === 'saved'
                  ? 'bg-amber/5 border border-amber/15'
                  : 'bg-surface border border-transparent',
            )}
          >
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
              style={{
                background: `rgba(${rgb},0.12)`,
                border: `1px solid rgba(${rgb},0.2)`,
              }}
            >
              <Icon size={11} style={{ color }} />
            </div>
            <span className="text-xs text-text font-medium flex-1 min-w-0 truncate">{label}</span>
            <ConnectionStatus status={status} size="sm" />
          </div>
        )
      })}

      {/* Encryption note */}
      <div className="mt-4 px-3 py-3 rounded-xl bg-surface border border-border">
        <p className="text-[11px] text-muted leading-relaxed">
          Keys encrypted with{' '}
          <span className="text-amber font-mono">Fernet</span>
          {' '}(AES-128-CBC + HMAC) at rest. Only the last 4 chars are shown.
        </p>
      </div>
    </div>
  )
}
