import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import gsap from 'gsap'
import { AlertTriangle } from 'lucide-react'
import { PageTransition } from '@/components/layout/PageTransition'
import { ContextInput } from '@/components/dashboard/ContextInput'
import { MediaUploader } from '@/components/dashboard/MediaUploader'
import { AdditionalInstructions } from '@/components/dashboard/AdditionalInstructions'
import { PlatformSelector } from '@/components/dashboard/PlatformSelector'
import { GenerateButton } from '@/components/dashboard/GenerateButton'
import { PostPreviewGrid } from '@/components/dashboard/PostPreviewGrid'
import { PublishBar } from '@/components/dashboard/PublishBar'
import { PublishModal } from '@/components/dashboard/PublishModal'
import { TemplateRow } from '@/components/dashboard/TemplateRow'
import { SaveTemplateModal } from '@/components/dashboard/SaveTemplateModal'
import { UpgradeModal } from '@/components/dashboard/UpgradeModal'
import { IdeasPanel } from '@/components/dashboard/IdeasPanel'
import { generatePosts, postToPlatform } from '@/services/generate'
import { createScheduledPost } from '@/services/schedule'
import { getHumanizeScore, getOriginalityScore } from '@/services/analyze'
import { getConnections } from '@/services/oauth'
import { useAuth } from '@/contexts/AuthContext'
import { useUsage } from '@/contexts/UsageContext'

// ── API key warning banner ─────────────────────────────────────────────────────
function ApiKeyWarning({ onDismiss }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber/30 bg-amber/5 mb-8">
      <AlertTriangle size={15} className="text-amber mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text">
          Add your{' '}
          <span className="text-amber font-medium">Claude API key</span>
          {' '}in Settings to start generating content.
        </p>
      </div>
      <button
        onClick={() => navigate('/settings')}
        className="text-xs font-medium text-amber hover:underline flex-shrink-0 mt-0.5"
      >
        Go to Settings →
      </button>
    </div>
  )
}

// ── Page header ────────────────────────────────────────────────────────────────
function DashboardHeader({ username }) {
  return (
    <div className="mb-10">
      <p className="text-sm text-muted font-medium mb-1">
        Good to see you,{' '}
        <span className="text-amber">{username ?? 'there'}</span>
      </p>
      <h1
        className="text-3xl font-bold text-heading mb-2"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        Create Content
      </h1>
      <p className="text-muted text-sm max-w-xl leading-relaxed">
        Describe your topic and PostPilot will craft platform-native posts
        tailored to each audience — ready to review, refine, and publish.
      </p>
      <p className="mt-3 text-[11px] text-muted/60">
        Tip: <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-border font-mono text-[10px]">Ctrl</kbd>
        {' '}+{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-border font-mono text-[10px]">Enter</kbd>
        {' '}to generate
      </p>
    </div>
  )
}

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-medium text-muted uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    limitReached, isFree, fetchUsage, plan,
    canHumanize, canOriginality, canDirectPost,
    isToneLocked, isPlatformLocked, isPlatformAllowed, requiredPlanFor,
  } = useUsage()

  // Pre-fill context when arriving from History "Reuse as template"
  const prefillContext = location.state?.context ?? ''

  // Refs for stagger entrance animation
  const section1Ref = useRef(null)
  const section2Ref = useRef(null)
  const section3Ref = useRef(null)

  // ── Core state ──
  const [context, setContext]            = useState(prefillContext)
  const [additionalInstr, setAdditional] = useState('')
  const [mediaFiles, setMediaFiles]      = useState([])
  const [selectedPlatforms, setSelected] = useState({})
  const [showApiWarning, setApiWarning]  = useState(false)

  // ── Generation state ──
  const [isGenerating, setIsGenerating]  = useState(false)
  const [generatedPosts, setGenerated]   = useState({})

  // ── Connections state ──
  const [connections, setConnections] = useState({})

  // ── Humanize scores ──
  const [humanizeScores, setHumanizeScores] = useState({})
  // Track last content scored per platform to skip duplicate API calls
  const scoredContentRef = useRef({})

  // ── Originality scores ──
  const [originalityScores, setOriginalityScores] = useState({})
  const originalityScoredRef = useRef({})

  // ── Publish state ──
  const [showPublishModal, setShowPublish] = useState(false)
  const [isPublishing, setIsPublishing]   = useState(false)
  const [publishResults, setPublishResults] = useState({})

  // ── Template state ──
  const [showSaveModal, setShowSaveModal] = useState(false)

  // ── Upgrade modal state ──
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: '' })
  const showUpgrade = (feature) => setUpgradeModal({ open: true, feature })
  const closeUpgrade = () => setUpgradeModal({ open: false, feature: '' })

  // ── Derived ──
  const selectedPlatformIds = Object.keys(selectedPlatforms).filter(
    (p) => !!selectedPlatforms[p],
  )
  const canGenerate       = context.trim().length > 0 && selectedPlatformIds.length > 0 && !limitReached
  const hasGeneratedPosts = Object.keys(generatedPosts).length > 0

  // Page title
  useEffect(() => { document.title = 'Create | PostPilot' }, [])

  // Fetch OAuth connections + Twitter keys on mount
  useEffect(() => {
    getConnections().then((oauthConns) => {
      setConnections({
        linkedin: oauthConns.linkedin?.connected ?? false,
        reddit: oauthConns.reddit?.connected ?? false,
        twitter: oauthConns.twitter?.connected ?? false,
      })
    }).catch(() => {})
  }, [])

  // Stagger entrance animation on mount
  useEffect(() => {
    const els = [section1Ref.current, section2Ref.current, section3Ref.current].filter(Boolean)
    gsap.fromTo(
      els,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.15 },
    )
  }, [])

  // Pre-fill from template (navigated from Templates page via location.state.template)
  useEffect(() => {
    const tpl = location.state?.template
    if (!tpl) return
    applyTemplate(tpl)
    // Clear state so back-navigation doesn't re-apply
    navigate(location.pathname, { replace: true, state: {} })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyTemplate(tpl) {
    setContext(tpl.context_template ?? '')
    if (tpl.platforms?.length) {
      const newSelected = {}
      tpl.platforms.forEach((p) => {
        newSelected[p] = {
          tone: tpl.tones?.[p] ?? 'professional',
          options: {},
        }
      })
      setSelected(newSelected)
    }
    // Scroll to context input
    setTimeout(() => section1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  const handleSelectTemplate = useCallback((tpl) => {
    applyTemplate(tpl)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      const mod = e.ctrlKey || e.metaKey
      // Ctrl+Enter → Generate
      if (mod && e.key === 'Enter' && canGenerate && !isGenerating) {
        e.preventDefault()
        handleGenerate()
      }
      // Ctrl+Shift+P → Publish all
      if (mod && e.shiftKey && e.key === 'P' && hasGeneratedPosts) {
        e.preventDefault()
        setShowPublish(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [canGenerate, isGenerating, hasGeneratedPosts])

  // ────────────────────────────────────────────────────────────────────────────
  const handleToggle = useCallback((platformId, isLockedClick) => {
    if (isLockedClick) {
      const plan = requiredPlanFor(platformId)
      showUpgrade(`${platformId.charAt(0).toUpperCase() + platformId.slice(1)} (${plan} plan)`)
      return
    }
    setSelected((prev) => {
      const already = !!prev[platformId]
      if (already) {
        const next = { ...prev }
        delete next[platformId]
        return next
      }
      // Check if platform is allowed by plan tier
      if (!isPlatformAllowed(platformId)) {
        const plan = requiredPlanFor(platformId)
        showUpgrade(`${platformId.charAt(0).toUpperCase() + platformId.slice(1)} (${plan} plan)`)
        return prev
      }
      // Check free-plan platform limit (max 3)
      const currentCount = Object.keys(prev).filter(k => prev[k]).length
      if (isPlatformLocked(currentCount)) {
        showUpgrade('All Platforms')
        return prev
      }
      return { ...prev, [platformId]: { tone: 'professional', options: {}, length: 'medium' } }
    })
  }, [isPlatformLocked, isPlatformAllowed, requiredPlanFor])

  const handleToneChange = useCallback((platformId, tone) => {
    if (isToneLocked(tone)) {
      showUpgrade(`${tone.charAt(0).toUpperCase() + tone.slice(1)} Tone`)
      return
    }
    setSelected((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], tone },
    }))
  }, [isToneLocked])

  const handleOptionChange = useCallback((platformId, newOptions) => {
    setSelected((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        options: newOptions,
      },
    }))
  }, [])

  const handleLengthChange = useCallback((platformId, length) => {
    setSelected((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], length },
    }))
  }, [])

  // ────────────────────────────────────────────────────────────────────────────
  // Generate
  // ── Score helpers ─────────────────────────────────────────────────────────────
  function scorePost(platform, content) {
    // Skip if plan doesn't include humanizer
    if (!canHumanize) return
    // Skip if the same content was already scored for this platform
    if (scoredContentRef.current[platform] === content) return

    scoredContentRef.current[platform] = content
    setHumanizeScores((prev) => ({
      ...prev,
      [platform]: { loading: true, data: prev[platform]?.data ?? null },
    }))
    getHumanizeScore(content, platform)
      .then((data) => {
        setHumanizeScores((prev) => ({
          ...prev,
          [platform]: { loading: false, data },
        }))
      })
      .catch(() => {
        // Fail silently — scoring is a non-critical background task
        scoredContentRef.current[platform] = null  // allow retry
        setHumanizeScores((prev) => ({
          ...prev,
          [platform]: { loading: false, data: prev[platform]?.data ?? null },
        }))
      })
  }

  function scoreOriginality(platform, content) {
    // Skip if plan doesn't include originality
    if (!canOriginality) return
    if (originalityScoredRef.current[platform] === content) return

    originalityScoredRef.current[platform] = content
    setOriginalityScores((prev) => ({
      ...prev,
      [platform]: { loading: true, data: prev[platform]?.data ?? null },
    }))
    getOriginalityScore(content, platform)
      .then((data) => {
        setOriginalityScores((prev) => ({
          ...prev,
          [platform]: { loading: false, data },
        }))
      })
      .catch(() => {
        originalityScoredRef.current[platform] = null
        setOriginalityScores((prev) => ({
          ...prev,
          [platform]: { loading: false, data: prev[platform]?.data ?? null },
        }))
      })
  }

  function handleRescoreNeeded(platform, content) {
    scorePost(platform, content)
    scoreOriginality(platform, content)
  }

  // ────────────────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canGenerate || isGenerating) return

    if (limitReached) {
      showUpgrade('More Generations')
      return
    }

    const loadingPosts = {}
    selectedPlatformIds.forEach((p) => {
      loadingPosts[p] = {
        content: '', raw: null,
        tone: selectedPlatforms[p]?.tone ?? 'professional',
        isLoading: true, isEdited: false, posted: false, post_url: null,
      }
    })
    setGenerated(loadingPosts)
    setPublishResults({})
    setHumanizeScores({})
    scoredContentRef.current = {}
    setOriginalityScores({})
    originalityScoredRef.current = {}
    setIsGenerating(true)

    try {
      const platformsPayload = {}
      selectedPlatformIds.forEach((p) => {
        platformsPayload[p] = {
          tone: selectedPlatforms[p]?.tone ?? 'professional',
          length: selectedPlatforms[p]?.length ?? 'medium',
          ...(selectedPlatforms[p]?.options ?? {}),
        }
      })
      const mediaInfo = mediaFiles
        .filter((f) => f.uploadedId)
        .map((f) => ({ id: f.uploadedId, name: f.name }))

      const data = await generatePosts(
        context.trim(),
        platformsPayload,
        additionalInstr.trim() || null,
        mediaInfo.map((m) => m.id),
      )

      const finalPosts = { ...loadingPosts }
      data.generated.forEach((post) => {
        finalPosts[post.platform] = {
          content: post.content, raw: post.raw ?? null, tone: post.tone,
          isLoading: false, isEdited: false, posted: false, post_url: null,
        }
      })
      setGenerated(finalPosts)

      // Auto-score each post in background (non-blocking)
      setHumanizeScores({})
      data.generated.forEach((post) => {
        scorePost(post.platform, post.content)
        scoreOriginality(post.platform, post.content)
      })

      // Refresh usage counters
      fetchUsage()
    } catch (err) {
      const detail = err?.response?.data?.detail ?? ''
      // Handle plan limit errors from backend (403)
      const detailObj = typeof detail === 'object' ? detail : {}
      if (err?.response?.status === 403 && detailObj.error) {
        const msg = detailObj.error === 'limit_reached'
          ? 'Generation limit reached'
          : detailObj.error === 'platform_limit'
          ? 'Platform limit reached'
          : detailObj.error === 'tone_locked'
          ? `${detailObj.locked_tone} tone`
          : 'This feature'
        showUpgrade(msg)
        setGenerated({})
        return
      }
      if ((typeof detail === 'string' && detail.toLowerCase().includes('api key')) || err?.response?.status === 401) {
        setApiWarning(true)
      }
      toast.error((typeof detail === 'string' ? detail : detail?.message) || 'Generation failed. Check your Claude API key in Settings.')
      setGenerated({})
    } finally {
      setIsGenerating(false)
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  function handleUpdate(platform, patch) {
    setGenerated((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], ...patch },
    }))
  }

  function handleSinglePostResult(platform, result) {
    setPublishResults((prev) => ({ ...prev, [platform]: result }))
    if (result.success) {
      handleUpdate(platform, { posted: true, post_url: result.post_url ?? null })
    }
  }

  async function handlePublishAll() {
    if (isPublishing) return
    setIsPublishing(true)

    const platforms = Object.keys(generatedPosts).filter(
      (p) => generatedPosts[p] && !generatedPosts[p].isLoading && !generatedPosts[p].posted,
    )

    const loadingResults = {}
    platforms.forEach((p) => { loadingResults[p] = { loading: true } })
    setPublishResults((prev) => ({ ...prev, ...loadingResults }))

    for (const platform of platforms) {
      try {
        const postData = generatedPosts[platform]
        const result   = await postToPlatform(
          platform,
          postData.content,
          [],
          { ...(selectedPlatforms[platform]?.options ?? {}), raw: postData.raw },
        )
        setPublishResults((prev) => ({
          ...prev,
          [platform]: { success: true, post_url: result.post_url ?? null },
        }))
        handleUpdate(platform, { posted: true, post_url: result.post_url ?? null })
      } catch (err) {
        const msg = err?.response?.data?.detail ?? 'Posting failed'
        setPublishResults((prev) => ({ ...prev, [platform]: { success: false, error: msg } }))
        toast.error(`${platform}: ${msg}`)
      }
    }

    setIsPublishing(false)
  }

  async function handleScheduleAll(utcIso, timezone) {
    if (isPublishing) return
    setIsPublishing(true)

    const platforms = Object.keys(generatedPosts).filter(
      (p) => generatedPosts[p] && !generatedPosts[p].isLoading && !generatedPosts[p].posted,
    )

    let ok = 0
    for (const platform of platforms) {
      try {
        const postData = generatedPosts[platform]
        await createScheduledPost({
          platform,
          content: postData.content,
          scheduled_at: utcIso,
          timezone,
          media_ids: mediaFiles.filter(f => f.uploadedId).map(f => f.uploadedId),
          options: { ...(selectedPlatforms[platform]?.options ?? {}), raw: postData.raw },
        })
        ok++
      } catch (err) {
        const msg = err?.response?.data?.detail ?? 'Scheduling failed'
        toast.error(`${platform}: ${msg}`)
      }
    }

    if (ok > 0) {
      toast.success(`${ok} post${ok > 1 ? 's' : ''} scheduled!`)
    }
    setIsPublishing(false)
    setShowPublish(false)
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <DashboardHeader username={user?.username} />

      {showApiWarning && <ApiKeyWarning onDismiss={() => setApiWarning(false)} />}

      {/* Templates row */}
      <TemplateRow onSelectTemplate={handleSelectTemplate} />

      {/* Post Ideas panel: full width below templates, above context input */}
      <div className="w-full mb-6">
        <IdeasPanel
          niche={context.trim() || undefined}
          onSelectIdea={(idea) => {
            setContext(idea.title + ' — ' + idea.description)
            // Pre-select suggested platforms + tone
            const newSelected = {}
            ;(idea.platforms ?? []).forEach((p) => {
              newSelected[p] = { tone: idea.tone || 'professional', options: {}, length: 'medium' }
            })
            if (Object.keys(newSelected).length > 0) setSelected(newSelected)
          }}
        />
      </div>

      {/* Section 1: Context */}
      <div ref={section1Ref} className="mb-8 opacity-0">
        <SectionLabel>What do you want to post about?</SectionLabel>
        <ContextInput value={context} onChange={setContext} />
        <div className="mt-3">
          <MediaUploader files={mediaFiles} onFilesChange={setMediaFiles} />
        </div>
        <div className="mt-3">
          <AdditionalInstructions value={additionalInstr} onChange={setAdditional} />
        </div>
      </div>

      {/* Section 2: Platform selection */}
      <div ref={section2Ref} className="mb-8 opacity-0">
        <SectionLabel>Select platforms & tones</SectionLabel>
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onToggle={handleToggle}
          onToneChange={handleToneChange}
          onOptionChange={handleOptionChange}
          onLengthChange={handleLengthChange}
          isToneLocked={isToneLocked}
          isPlatformLocked={isPlatformLocked}
          isPlatformAllowed={isPlatformAllowed}
          requiredPlanFor={requiredPlanFor}
          selectedCount={selectedPlatformIds.length}
        />
      </div>

      {/* Section 3: Generate button */}
      <div ref={section3Ref} className="mb-10 opacity-0">
        <GenerateButton
          isLoading={isGenerating}
          isDisabled={!canGenerate}
          onClick={handleGenerate}
          limitReached={limitReached}
          onUpgrade={() => showUpgrade('More Generations')}
        />
      </div>

      {/* Section 4: Generated posts */}
      {hasGeneratedPosts && (
        <div className="pb-28">
          <PostPreviewGrid
            generatedPosts={generatedPosts}
            selectedPlatforms={selectedPlatforms}
            context={context}
            connections={connections}
            mediaIds={mediaFiles.filter(f => f.uploadedId).map(f => f.uploadedId)}
            humanizeScores={humanizeScores}
            originalityScores={originalityScores}
            onUpdate={handleUpdate}
            onPost={handleSinglePostResult}
            onRescoreNeeded={handleRescoreNeeded}
            onSaveTemplate={() => setShowSaveModal(true)}
            canDirectPost={canDirectPost}
            canHumanize={canHumanize}
            canOriginality={canOriginality}
            onUpgrade={showUpgrade}
          />
        </div>
      )}

      {/* Sticky publish bar */}
      {hasGeneratedPosts && (
        <PublishBar
          generatedPosts={generatedPosts}
          publishResults={publishResults}
          onPublishAll={() => setShowPublish(true)}
          isPublishing={isPublishing}
        />
      )}

      {/* Publish modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublish(false)}
        generatedPosts={generatedPosts}
        publishResults={publishResults}
        onPublishAll={handlePublishAll}
        onScheduleAll={handleScheduleAll}
        canSchedule={plan === 'pro'}
        onUpgrade={() => showUpgrade('Scheduled Posting')}
        isPublishing={isPublishing}
      />

      {/* Save as Template modal */}
      <SaveTemplateModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        context={context}
      />

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={closeUpgrade}
        feature={upgradeModal.feature}
      />
    </PageTransition>
  )
}
