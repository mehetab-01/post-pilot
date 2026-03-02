import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { Sparkles } from 'lucide-react'
import { PostPreview } from './PostPreview'

// ── Ready heading ──────────────────────────────────────────────────────────────
function ReadyHeading({ show }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!show || !ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 },
    )
  }, [show])

  if (!show) return null

  return (
    <div ref={ref} className="flex items-center gap-2.5 mb-6">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber/15 border border-amber/25">
        <Sparkles size={13} className="text-amber" />
      </div>
      <h2 className="text-base font-semibold text-heading font-heading">
        Your posts are ready
      </h2>
      <div className="flex-1 h-px bg-border ml-1" />
    </div>
  )
}

// ── Card container ─────────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

// ── Main component ─────────────────────────────────────────────────────────────
export function PostPreviewGrid({
  generatedPosts,
  selectedPlatforms,
  context,
  connections = {},
  mediaIds = [],
  onUpdate,
  onPost,
}) {
  // selectedPlatforms: { twitter: { tone, options }, ... }
  const platforms = Object.keys(generatedPosts)
  const hasAny    = platforms.length > 0

  // Only show platforms that are selected AND have generated posts
  const visiblePlatforms = platforms.filter(
    (p) => selectedPlatforms[p] && generatedPosts[p],
  )

  return (
    <section>
      <ReadyHeading show={hasAny} />

      <div className="flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {visiblePlatforms.map((platform, i) => (
            <motion.div
              key={platform}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <PostPreview
                platform={platform}
                postData={generatedPosts[platform]}
                context={context}
                platformConfig={selectedPlatforms[platform]}
                isConnected={connections[platform] ?? null}
                mediaIds={mediaIds}
                onUpdate={(patch) => onUpdate(platform, patch)}
                onPost={(result) => onPost(platform, result)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
