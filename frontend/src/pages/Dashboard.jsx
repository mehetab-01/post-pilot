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
import { generatePosts, postToPlatform } from '@/services/generate'
import { getConnections } from '@/services/oauth'
import { settingsApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

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

  // ── Publish state ──
  const [showPublishModal, setShowPublish] = useState(false)
  const [isPublishing, setIsPublishing]   = useState(false)
  const [publishResults, setPublishResults] = useState({})

  // ── Derived ──
  const selectedPlatformIds = Object.keys(selectedPlatforms).filter(
    (p) => !!selectedPlatforms[p],
  )
  const canGenerate       = context.trim().length > 0 && selectedPlatformIds.length > 0
  const hasGeneratedPosts = Object.keys(generatedPosts).length > 0

  // Page title
  useEffect(() => { document.title = 'Create | PostPilot' }, [])

  // Fetch OAuth connections + Twitter keys on mount
  useEffect(() => {
    Promise.all([getConnections(), settingsApi.getKeys()]).then(([oauthConns, keysRes]) => {
      const twitterKeys = keysRes.data?.find?.(p => p.platform === 'twitter')?.keys ?? []
      setConnections({
        linkedin: oauthConns.linkedin?.connected ?? false,
        reddit: oauthConns.reddit?.connected ?? false,
        twitter: twitterKeys.length > 0,
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
  const handleToggle = useCallback((platformId) => {
    setSelected((prev) => {
      const already = !!prev[platformId]
      if (already) {
        const next = { ...prev }
        delete next[platformId]
        return next
      }
      return { ...prev, [platformId]: { tone: 'professional', options: {} } }
    })
  }, [])

  const handleToneChange = useCallback((platformId, tone) => {
    setSelected((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], tone },
    }))
  }, [])

  const handleOptionChange = useCallback((platformId, key, value) => {
    setSelected((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        options: { ...prev[platformId]?.options, [key]: value },
      },
    }))
  }, [])

  // ────────────────────────────────────────────────────────────────────────────
  // Generate
  // ────────────────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canGenerate || isGenerating) return

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
    setIsGenerating(true)

    try {
      const platformsPayload = {}
      selectedPlatformIds.forEach((p) => {
        platformsPayload[p] = {
          tone: selectedPlatforms[p]?.tone ?? 'professional',
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
    } catch (err) {
      const detail = err?.response?.data?.detail ?? ''
      if (detail.toLowerCase().includes('api key') || err?.response?.status === 401) {
        setApiWarning(true)
      }
      toast.error(detail || 'Generation failed. Check your Claude API key in Settings.')
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

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <DashboardHeader username={user?.username} />

      {showApiWarning && <ApiKeyWarning onDismiss={() => setApiWarning(false)} />}

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
        />
      </div>

      {/* Section 3: Generate button */}
      <div ref={section3Ref} className="mb-10 opacity-0">
        <GenerateButton
          isLoading={isGenerating}
          isDisabled={!canGenerate}
          onClick={handleGenerate}
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
            onUpdate={handleUpdate}
            onPost={handleSinglePostResult}
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
        isPublishing={isPublishing}
      />
    </PageTransition>
  )
}
