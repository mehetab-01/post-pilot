import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const EFFECTIVE_DATE = 'March 4, 2026'

/**
 * Shared wrapper for all legal / policy pages.
 * Renders a consistent header with back navigation, title, effective date,
 * and properly styled prose content.
 */
export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4"
        style={{
          background: 'rgba(5,5,8,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(139,92,246,0.1)',
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={15} />
          Home
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-heading font-medium truncate">{title}</span>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1
          className="font-heading font-bold text-3xl md:text-4xl text-heading mb-3"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {title}
        </h1>
        <p className="text-muted text-sm mb-10">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="legal-prose space-y-6 text-text text-[15px] leading-relaxed">
          {children}
        </div>

        {/* Bottom nav */}
        <div
          className="mt-16 pt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
          style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
        >
          <Link to="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-text transition-colors">Terms of Service</Link>
          <Link to="/cookies" className="hover:text-text transition-colors">Cookie Policy</Link>
          <Link to="/acceptable-use" className="hover:text-text transition-colors">Acceptable Use</Link>
        </div>

        <p className="text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} PostPilot (operated by TabCrypt). All rights reserved.
        </p>
      </main>
    </div>
  )
}
