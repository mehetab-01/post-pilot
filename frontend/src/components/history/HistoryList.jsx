import { motion, AnimatePresence } from 'framer-motion'
import { HistoryCard } from './HistoryCard'
import { EmptyState } from './EmptyState'

// Shimmer skeleton for loading state
function CardSkeleton({ i }) {
  return (
    <div
      className="bg-surface border border-border rounded-2xl h-[90px] shimmer"
      style={{ animationDelay: `${i * 0.05}s` }}
    />
  )
}

const cardVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
}

export function HistoryList({
  posts,
  isLoading,
  hasMore,
  onLoadMore,
  onDeleted,
  hasFilters,
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} i={i} />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return <EmptyState hasFilters={hasFilters} />
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <HistoryCard item={post} onDeleted={onDeleted} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-5 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-text hover:border-zinc-600 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
