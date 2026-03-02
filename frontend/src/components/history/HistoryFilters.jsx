import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { clsx } from 'clsx'
import { PLATFORM_MAP } from '@/components/dashboard/constants'

const PLATFORM_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'twitter',   label: 'X'         },
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'reddit',    label: 'Reddit'    },
  { id: 'instagram', label: 'Instagram' },
  { id: 'whatsapp',  label: 'WhatsApp'  },
]

const STATUS_PILLS = [
  { id: 'all',       label: 'All'       },
  { id: 'published', label: 'Published' },
  { id: 'draft',     label: 'Draft'     },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

function Pill({ active, onClick, children }) {
  const cfg = PLATFORM_MAP[children?.toLowerCase?.()]
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex-shrink-0',
        active
          ? 'bg-amber text-zinc-900'
          : 'bg-surface border border-border text-muted hover:text-text hover:border-zinc-600',
      )}
    >
      {children}
    </button>
  )
}

export function HistoryFilters({ filters, onChange }) {
  const searchRef    = useRef(null)
  const debounceRef  = useRef(null)

  // Debounce search
  function handleSearch(e) {
    const val = e.target.value
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange({ search: val })
    }, 300)
    // Update visual input immediately (uncontrolled for typing feel)
  }

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Row 1: Platform pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted font-medium flex-shrink-0">Platform:</span>
        {PLATFORM_PILLS.map((p) => (
          <Pill
            key={p.id}
            active={filters.platform === p.id}
            onClick={() => onChange({ platform: p.id })}
          >
            {p.label}
          </Pill>
        ))}
      </div>

      {/* Row 2: Status pills + sort + search */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-medium flex-shrink-0">Status:</span>
          {STATUS_PILLS.map((s) => (
            <Pill
              key={s.id}
              active={filters.status === s.id}
              onClick={() => onChange({ status: s.id })}
            >
              {s.label}
            </Pill>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="ml-auto px-3 py-1.5 rounded-lg border border-border bg-surface text-muted text-xs hover:border-zinc-600 focus:outline-none focus:border-amber transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            defaultValue={filters.search}
            onChange={handleSearch}
            placeholder="Search posts…"
            className="pl-8 pr-7 py-1.5 rounded-lg border border-border bg-surface text-xs text-text placeholder:text-muted focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 transition-colors w-44"
          />
          {filters.search && (
            <button
              onClick={() => {
                if (searchRef.current) searchRef.current.value = ''
                onChange({ search: '' })
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
