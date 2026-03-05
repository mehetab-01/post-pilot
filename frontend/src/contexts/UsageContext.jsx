import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usageApi } from '@/services/api'
import { useAuth } from './AuthContext'

const UsageContext = createContext(null)

const FREE_TONES = new Set(['professional', 'casual', 'educational'])

export function UsageProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated) { setUsage(null); setLoading(false); return }
    try {
      const res = await usageApi.getUsage()
      setUsage(res.data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch on mount and when auth changes
  useEffect(() => { fetchUsage() }, [fetchUsage])

  // Derived helpers
  const plan = usage?.plan ?? 'free'
  const isFree = plan === 'free'
  const used = usage?.generations_used ?? 0
  const limit = usage?.generations_limit ?? 10
  const remaining = Math.max(0, limit - used)
  const limitReached = used >= limit
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const features = usage?.features ?? {}
  const daysUntilReset = usage?.days_until_reset ?? 0

  // Feature checks
  const canDirectPost = features.direct_posting ?? false
  const canHumanize = features.humanizer ?? false
  const canOriginality = features.originality ?? false
  const hasAllTones = features.all_tones ?? false
  const hasAllPlatforms = features.all_platforms ?? false
  const allowedPlatforms = new Set(usage?.allowed_platforms ?? [
    'twitter', 'linkedin', 'reddit', 'instagram', 'whatsapp',
  ])

  const isToneLocked = (toneId) => isFree && !FREE_TONES.has(toneId)
  const isPlatformLocked = (selectedCount) => isFree && selectedCount >= 3
  const isPlatformAllowed = (platformId) => allowedPlatforms.has(platformId)

  // Determine what plan is needed to unlock a given platform
  const requiredPlanFor = (platformId) => {
    if (['bluesky', 'mastodon'].includes(platformId)) return 'Starter'
    if (['threads'].includes(platformId)) return 'Pro'
    return null
  }

  return (
    <UsageContext.Provider
      value={{
        usage, loading, fetchUsage,
        plan, isFree, used, limit, remaining, limitReached, pct, daysUntilReset,
        canDirectPost, canHumanize, canOriginality, hasAllTones, hasAllPlatforms,
        isToneLocked, isPlatformLocked, isPlatformAllowed, requiredPlanFor,
        allowedPlatforms,
      }}
    >
      {children}
    </UsageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUsage() {
  const ctx = useContext(UsageContext)
  if (!ctx) throw new Error('useUsage must be used within UsageProvider')
  return ctx
}
