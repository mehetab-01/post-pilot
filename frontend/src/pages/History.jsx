import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { PageTransition } from '@/components/layout/PageTransition'
import { HistoryFilters } from '@/components/history/HistoryFilters'
import { HistoryList } from '@/components/history/HistoryList'
import { getHistory } from '@/services/history'

const BATCH = 30

const DEFAULT_FILTERS = {
  platform: 'all',
  status:   'all',
  sort:     'newest',
  search:   '',
}

// ── Client-side filter + sort ──────────────────────────────────────────────────
function applyFilters(posts, filters) {
  let result = [...posts]

  if (filters.platform !== 'all') {
    result = result.filter((p) => p.platform === filters.platform)
  }

  if (filters.status === 'published') {
    result = result.filter((p) => p.posted)
  } else if (filters.status === 'draft') {
    result = result.filter((p) => !p.posted)
  }

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase().trim()
    result = result.filter((p) =>
      (p.content ?? '').toLowerCase().includes(q)
    )
  }

  result.sort((a, b) => {
    const da = new Date(a.created_at)
    const db = new Date(b.created_at)
    return filters.sort === 'oldest' ? da - db : db - da
  })

  return result
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function History() {
  const location = useLocation()

  const [allPosts, setAllPosts]   = useState([])
  const [isLoading, setLoading]   = useState(true)
  const [offset, setOffset]       = useState(0)
  const [hasMore, setHasMore]     = useState(true)
  const [filters, setFilters]     = useState(DEFAULT_FILTERS)

  // Set page title
  useEffect(() => { document.title = 'History | PostPilot' }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    getHistory(BATCH, 0)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.items ?? [])
        setAllPosts(items)
        setHasMore(items.length === BATCH)
        setOffset(BATCH)
      })
      .catch(() => setAllPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const handleLoadMore = useCallback(() => {
    getHistory(BATCH, offset).then((data) => {
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      setAllPosts((prev) => [...prev, ...items])
      setHasMore(items.length === BATCH)
      setOffset((o) => o + BATCH)
    })
  }, [offset])

  const handleFilterChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleDeleted = useCallback((id) => {
    setAllPosts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const filteredPosts = useMemo(() => applyFilters(allPosts, filters), [allPosts, filters])

  const hasFilters =
    filters.platform !== 'all' ||
    filters.status !== 'all' ||
    filters.search.trim() !== ''

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted font-medium mb-1">Your content</p>
        <h1
          className="text-3xl font-bold text-heading mb-2"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Post History
        </h1>
        <p className="text-muted text-sm">
          Everything you've created and published.
          {!isLoading && allPosts.length > 0 && (
            <span className="ml-1">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
              {hasFilters ? ' matching' : ' total'}.
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      {!isLoading && (
        <HistoryFilters filters={filters} onChange={handleFilterChange} />
      )}

      {/* List */}
      <HistoryList
        posts={filteredPosts}
        isLoading={isLoading}
        hasMore={hasMore && !hasFilters}
        onLoadMore={handleLoadMore}
        onDeleted={handleDeleted}
        hasFilters={hasFilters}
      />
    </PageTransition>
  )
}
