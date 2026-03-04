import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { PageTransition } from '@/components/layout/PageTransition'
import { PlatformKeySection } from '@/components/settings/PlatformKeySection'
import { StatusSidebar } from '@/components/settings/StatusSidebar'
import { DangerZone } from '@/components/settings/DangerZone'
import { BillingSection } from '@/components/settings/BillingSection'
import { AiProviders } from '@/components/settings/AiProviders'
import { PLATFORM_CONFIGS } from '@/components/settings/configs'
import { getKeys } from '@/services/settings'
import { getConnections } from '@/services/oauth'

// ── Loading skeleton ───────────────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl h-[68px] shimmer" />
  )
}

// ── Page header ────────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div className="mb-10">
      <p className="text-sm text-muted font-medium mb-1">Configuration</p>
      <h1
        className="text-3xl font-bold text-heading mb-2"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        Settings
      </h1>
      <p className="text-muted text-sm max-w-xl leading-relaxed">
        Add your AI providers and connect your social accounts. API keys are encrypted
        at rest with Fernet (AES-128-CBC + HMAC-SHA256).
      </p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Settings() {
  const [keysData, setKeysData]             = useState({})
  const [testResults, setTestResults]       = useState({})
  const [oauthConnections, setOauthConnections] = useState({})
  const [isLoading, setIsLoading]           = useState(true)
  const location = useLocation()
  const sectionsRef = useRef([])

  // Page title
  useEffect(() => { document.title = 'Settings | PostPilot' }, [])

  // Detect ?connected=platform after OAuth callback and show toast
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const connected = params.get('connected')
    const error     = params.get('error')
    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`)
      // Clean the URL without reloading
      window.history.replaceState({}, '', '/settings')
    }
    if (error) {
      toast.error(`OAuth error: ${error}`)
      window.history.replaceState({}, '', '/settings')
    }
  }, [location.search])

  // Load saved keys + OAuth connections in parallel on mount
  useEffect(() => {
    Promise.all([
      getKeys().catch(() => ({})),
      getConnections().catch(() => ({})),
    ]).then(([keys, conns]) => {
      setKeysData(keys ?? {})
      setOauthConnections(conns ?? {})
    }).finally(() => setIsLoading(false))
  }, [])

  // Stagger entrance animation once loaded
  useEffect(() => {
    if (isLoading) return
    const els = sectionsRef.current.filter(Boolean)
    if (!els.length) return
    gsap.fromTo(
      els,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', delay: 0.05 },
    )
  }, [isLoading])

  async function handleSave() {
    try {
      const data = await getKeys()
      setKeysData(data ?? {})
    } catch { /* fail silently */ }
  }

  function handleTest(platform, success) {
    setTestResults((prev) => ({ ...prev, [platform]: { success } }))
  }

  function handleConnectionChange(platform, conn) {
    setOauthConnections((prev) => ({ ...prev, [platform]: conn }))
  }

  return (
    <PageTransition>
      <PageHeader />

      <div className="flex gap-8 items-start">
        {/* Left: sticky status sidebar (hidden on mobile) */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0 sticky top-10">
          <StatusSidebar
            keysData={keysData}
            testResults={testResults}
            oauthConnections={oauthConnections}
          />
        </aside>

        {/* Right: settings sections */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* ── AI Providers section ── */}
          <div ref={(el) => (sectionsRef.current[0] = el)}>
            <p className="text-[11px] font-medium text-muted uppercase tracking-widest mb-3">
              AI Providers &amp; Fallback Chain
            </p>
            <div className="bg-surface border border-border rounded-2xl p-5">
              <AiProviders />
            </div>
          </div>

          {/* ── Social platforms ── */}
          <div ref={(el) => (sectionsRef.current[1] = el)}>
            <p className="text-[11px] font-medium text-muted uppercase tracking-widest mb-3">
              Social Platforms
            </p>
            <div className="flex flex-col gap-4">
              {isLoading ? (
                PLATFORM_CONFIGS.map((_, i) => <SectionSkeleton key={i} />)
              ) : (
                PLATFORM_CONFIGS.map((config, i) => (
                  <div key={config.id} ref={(el) => (sectionsRef.current[i + 2] = el)}>
                    <PlatformKeySection
                      config={config}
                      savedKeys={keysData[config.id] ?? null}
                      testResult={testResults[config.id] ?? null}
                      oauthConnections={oauthConnections}
                      onSave={handleSave}
                      onTest={handleTest}
                      onConnectionChange={handleConnectionChange}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Billing & Subscription ── */}
          {!isLoading && (
            <div
              ref={(el) => (sectionsRef.current[PLATFORM_CONFIGS.length + 2] = el)}
            >
              <p className="text-[11px] font-medium text-muted uppercase tracking-widest mb-3">
                Billing &amp; Subscription
              </p>
              <BillingSection />
            </div>
          )}

          {/* ── Account / Danger zone ── */}
          {!isLoading && (
            <div
              ref={(el) => (sectionsRef.current[PLATFORM_CONFIGS.length + 3] = el)}
            >
              <p className="text-[11px] font-medium text-muted uppercase tracking-widest mb-3">
                Account
              </p>
              <DangerZone />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
