import { useRef, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Compass, Clock, CalendarClock, Settings, LogOut, LayoutTemplate, Zap, BarChart3, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { useUsage } from '@/contexts/UsageContext'
import { UpgradeModal } from '@/components/dashboard/UpgradeModal'

const NAV_ITEMS = [
  { to: '/dashboard', icon: Compass,        label: 'Create'         },
  { to: '/engine',    icon: Flame,          label: 'Content Engine' },
  { to: '/history',   icon: Clock,          label: 'History'        },
  { to: '/scheduled', icon: CalendarClock,  label: 'Scheduled'      },
  { to: '/analytics', icon: BarChart3,      label: 'Analytics'      },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates'      },
  { to: '/settings',  icon: Settings,       label: 'Settings'       },
]

// ── Logo with fluid plasma background ────────────────────────────────────────
function Logo() {
  const b1 = useRef(null)
  const b2 = useRef(null)
  const b3 = useRef(null)
  const b4 = useRef(null)

  useEffect(() => {
    // Each blob drifts in a unique elliptical path — no two in sync
    gsap.to(b1.current, { x: 16, y: -8,  duration: 3.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    gsap.to(b2.current, { x: -14, y: 12, duration: 4.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.9 })
    gsap.to(b3.current, { x: 10, y: 16,  duration: 3.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.7 })
    gsap.to(b4.current, { x: -8, y: -14, duration: 5.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2.3 })
  }, [])

  return (
    <div className="flex items-center gap-3 px-5 py-5 mb-2">
      <div
        className="relative flex-shrink-0 w-9 h-9 rounded-[10px] overflow-hidden"
        style={{ boxShadow: '0 0 18px rgba(139,92,246,0.35)' }}
      >
        {/* Deep base so blobs have contrast */}
        <div className="absolute inset-0" style={{ background: '#08041a' }} />

        {/* Fluid plasma blobs — blurred together to create liquid mixing */}
        <div className="absolute inset-0" style={{ filter: 'blur(7px)', transform: 'scale(1.15)' }}>
          <div ref={b1} className="absolute rounded-full" style={{
            width: 30, height: 30, top: -6, left: -6,
            background: 'radial-gradient(circle, rgba(124,58,237,1) 0%, transparent 65%)',
          }} />
          <div ref={b2} className="absolute rounded-full" style={{
            width: 26, height: 26, top: 6, right: -8,
            background: 'radial-gradient(circle, rgba(192,132,252,0.95) 0%, transparent 65%)',
          }} />
          <div ref={b3} className="absolute rounded-full" style={{
            width: 28, height: 28, bottom: -8, left: 2,
            background: 'radial-gradient(circle, rgba(79,70,229,0.9) 0%, transparent 65%)',
          }} />
          <div ref={b4} className="absolute rounded-full" style={{
            width: 22, height: 22, top: 2, left: 8,
            background: 'radial-gradient(circle, rgba(216,180,254,0.7) 0%, transparent 65%)',
          }} />
        </div>

        {/* Logo floats above fluid — drop-shadow keeps it crisp */}
        <img
          src="/logo.png"
          alt="PostPilot"
          className="absolute inset-0 w-full h-full object-contain p-0.5"
          style={{ zIndex: 10, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
        />
      </div>
      <span
        className="text-white font-semibold text-[15px] tracking-tight"
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
            ? 'text-white bg-white/[0.07]'
            : 'text-muted hover:text-text hover:bg-white/[0.04]'
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

// ── Usage bar ─────────────────────────────────────────────────────────────────
function UsageBar({ onUpgrade }) {
  const { plan, used, limit, pct, daysUntilReset, isFree, loading } = useUsage()

  if (loading) return null

  const barColor =
    pct >= 90 ? '#f87171' :
    pct >= 70 ? '#fbbf24' :
    '#8b5cf6'

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  return (
    <div
      className="mx-3 mb-2 p-3 rounded-xl"
      style={{
        background: 'rgba(139,92,246,0.04)',
        border: '1px solid rgba(139,92,246,0.12)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-amber" />
          <span className="text-[11px] font-semibold text-heading">{planLabel}</span>
        </div>
        <span className="text-[11px] text-muted">
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <p className="text-[10px] text-muted mt-1.5">
        {limit - used} posts left · resets in {daysUntilReset}d
      </p>
      {isFree && (
        <button
          onClick={onUpgrade}
          className="flex items-center justify-center gap-1.5 mt-2 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:brightness-110 w-full cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' }}
        >
          <Zap size={11} />
          Upgrade
        </button>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
    onCloseMobile?.()
  }

  const initials = user?.username?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
    <aside
      className={clsx(
        'fixed top-0 left-0 h-full w-[260px] flex flex-col z-40',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{
        background: 'rgba(5, 5, 10, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(139, 92, 246, 0.12)',
      }}
    >
      {/* Subtle violet left-edge glow */}
      <div
        className="absolute inset-y-0 right-0 w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.2), transparent)' }}
      />

      <Logo />
      <div className="mx-4 h-px mb-3" style={{ background: 'rgba(139,92,246,0.1)' }} />

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={onCloseMobile} />
        ))}
      </nav>

      <UsageBar onUpgrade={() => setUpgradeOpen(true)} />

      <div
        className="mx-3 mb-3 p-3 rounded-xl flex items-center gap-3"
        style={{
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.15)',
        }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full text-amber font-semibold text-sm flex-shrink-0"
          style={{
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          {initials}
        </div>
        <span className="text-text text-sm font-medium truncate flex-1 min-w-0">
          {user?.username ?? '—'}
        </span>
        <button
          onClick={handleLogout}
          className="text-muted hover:text-danger transition-colors p-1 rounded-lg hover:bg-white/5 flex-shrink-0"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
    <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
