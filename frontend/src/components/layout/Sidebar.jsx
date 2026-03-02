import { useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Compass, Clock, Settings, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: Compass,  label: 'Create'   },
  { to: '/history',   icon: Clock,    label: 'History'  },
  { to: '/settings',  icon: Settings, label: 'Settings' },
]

// ── Logo monogram with GSAP glow pulse ────────────────────────────────────────
function Logo() {
  const glowRef = useRef(null)

  useEffect(() => {
    if (!glowRef.current) return
    const tween = gsap.to(glowRef.current, {
      boxShadow: '0 0 24px 4px rgba(245,158,11,0.35)',
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
    return () => tween.kill()
  }, [])

  return (
    <div className="flex items-center gap-3 px-5 py-5 mb-2">
      <div
        ref={glowRef}
        className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-white overflow-hidden flex-shrink-0"
        style={{ boxShadow: '0 0 12px rgba(245,158,11,0.2)' }}
      >
        <img src="/logo.png" alt="PostPilot" className="w-full h-full object-contain p-0.5" />
      </div>
      <span
        className="text-heading font-heading font-semibold text-[15px] tracking-tight"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        PostPilot
      </span>
    </div>
  )
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          isActive
            ? 'text-heading bg-surface-2'
            : 'text-muted hover:text-text hover:bg-surface'
        )
      }
    >
      {({ isActive }) => (
        <>
          <motion.span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-amber"
            initial={false}
            animate={{
              height: isActive ? '60%' : '0%',
              opacity: isActive ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          <Icon
            size={17}
            className={clsx(
              'transition-colors duration-150',
              isActive ? 'text-amber' : 'text-muted group-hover:text-text'
            )}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
    onCloseMobile?.()
  }

  const initials = user?.username?.charAt(0).toUpperCase() ?? '?'

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-full w-[260px] flex flex-col border-r border-border z-40',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{
        background: 'rgba(9, 9, 11, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <Logo />
      <div className="mx-4 h-px bg-border mb-3" />

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={onCloseMobile} />
        ))}
      </nav>

      <div className="mx-3 mb-3 p-3 rounded-xl border border-border bg-surface flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-glow border border-amber/30 text-amber font-semibold text-sm flex-shrink-0">
          {initials}
        </div>
        <span className="text-text text-sm font-medium truncate flex-1 min-w-0">
          {user?.username ?? '—'}
        </span>
        <button
          onClick={handleLogout}
          className="text-muted hover:text-danger transition-colors p-1 rounded-lg hover:bg-zinc-800 flex-shrink-0"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
