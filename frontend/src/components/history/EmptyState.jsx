import { useNavigate } from 'react-router-dom'

function PaperPlane() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-30"
    >
      <path
        d="M62 10L30 42M62 10L44 62L30 42M62 10L10 30L30 42"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 42L34 56"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EmptyState({ hasFilters }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <PaperPlane />
      <h3 className="mt-6 text-lg font-semibold text-heading font-heading">
        {hasFilters ? 'No matching posts' : 'No posts yet'}
      </h3>
      <p className="mt-2 text-sm text-muted max-w-xs leading-relaxed">
        {hasFilters
          ? 'Try adjusting your filters to see more results.'
          : 'Create your first AI-generated post and it will appear here.'}
      </p>
      {!hasFilters && (
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 px-5 py-2.5 rounded-xl bg-amber text-white text-sm font-semibold hover:bg-amber-light transition-colors active:scale-[0.98]"
        >
          Create your first post
        </button>
      )}
    </div>
  )
}
