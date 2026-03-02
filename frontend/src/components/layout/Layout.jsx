import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-[260px] min-h-screen overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 z-20 bg-bg/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-zinc-800 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <span
            className="text-heading font-semibold text-sm"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            PostPilot
          </span>
        </div>

        <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
