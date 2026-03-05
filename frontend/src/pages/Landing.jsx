import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Sparkles, ArrowRight, Check, FileText, LayoutGrid,
  Rocket, Type, Brain, Fingerprint, Send,
  LayoutTemplate, History, Shield, CreditCard,
  CalendarClock, Lightbulb, BarChart3,
} from 'lucide-react'
import {
  FaTwitter, FaLinkedin, FaRedditAlien, FaInstagram,
  FaWhatsapp, FaMastodon,
} from 'react-icons/fa'
import { SiBluesky } from 'react-icons/si'
import toast from 'react-hot-toast'
import { openRazorpayCheckout } from '@/services/billing'

gsap.registerPlugin(ScrollTrigger)

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════════ */

const PLATFORM_DEMOS = [
  {
    platform: 'X (Twitter)',
    color: '#e7e7e7',
    Icon: FaTwitter,
    content:
      "\u{1F680} Just shipped our AI content engine! It doesn't just write posts \u2014 it thinks like your audience. Try PostPilot today.",
  },
  {
    platform: 'LinkedIn',
    color: '#0a66c2',
    Icon: FaLinkedin,
    content:
      "Excited to announce: after 3 months of building, we've created something that fundamentally changes how founders approach content creation.",
  },
  {
    platform: 'Reddit',
    color: '#ff4500',
    Icon: FaRedditAlien,
    content:
      'PSA: Stop spending hours writing social posts. I built an AI tool that creates platform-specific content in seconds. AMA in comments!',
  },
]

const STRIP_PLATFORMS = [
  { Icon: FaTwitter,      name: 'X (Twitter)', color: '#e7e7e7' },
  { Icon: FaLinkedin,     name: 'LinkedIn',    color: '#0a66c2' },
  { Icon: FaInstagram,    name: 'Instagram',   color: '#e1306c' },
  { Icon: FaWhatsapp,     name: 'WhatsApp',    color: '#25d366' },
  { Icon: FaRedditAlien,  name: 'Reddit',      color: '#ff4500' },
  { Icon: SiBluesky,      name: 'Bluesky',     color: '#0085ff' },
  { Icon: FaMastodon,     name: 'Mastodon',    color: '#6364ff' },
]

const STEPS = [
  {
    icon: FileText,
    title: 'Drop your context',
    description: 'Paste your raw idea, context, or announcement.',
  },
  {
    icon: LayoutGrid,
    title: 'Pick platforms & tone',
    description: 'Choose where to post and how it should sound.',
  },
  {
    icon: Rocket,
    title: 'Generate & publish',
    description: 'AI crafts unique posts for each platform. Post with one click.',
  },
]

const FEATURES = [
  {
    icon: Type,
    title: '8 Tone Styles',
    description: 'Professional to Bold \u2014 each platform gets its own voice.',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
  },
  {
    icon: Brain,
    title: 'AI Humanizer Score',
    description: 'Know exactly how human your post sounds before publishing.',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  },
  {
    icon: Fingerprint,
    title: 'Originality Check',
    description: "Ensure your content isn't generic AI slop.",
    gradient: 'linear-gradient(135deg, #a78bfa, #c4b5fd)',
  },
  {
    icon: Send,
    title: 'One-Click Publish',
    description: 'Post to all platforms simultaneously.',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
  },
  {
    icon: LayoutTemplate,
    title: 'Smart Templates',
    description: 'Reuse winning post formats with one click.',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
  {
    icon: History,
    title: 'Post History',
    description: "Track everything you've created and published.",
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled Posting',
    description: 'Queue posts and publish them at the perfect time.',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
  },
  {
    icon: Lightbulb,
    title: 'Content Ideas',
    description: 'AI-generated post ideas based on your niche.',
    gradient: 'linear-gradient(135deg, #eab308, #facc15)',
  },
  {
    icon: BarChart3,
    title: 'Post Analytics',
    description: 'Track engagement, likes, shares and find your best content.',
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
  },
]

const PLANS = {
  monthly: [
    {
      name: 'Free',
      price: 'Free',
      period: 'forever',
      features: [
        '10 AI generations / month',
        '3 platforms',
        'Basic tones (Professional, Casual, Educational)',
        'Copy to clipboard only',
        'Community templates',
        '3 content ideas / day',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Starter',
      price: '$6',
      altPrice: '\u20B9499',
      period: '/mo',
      features: [
        'Everything in Free, plus:',
        '50 AI generations / month',
        'All platforms',
        'All 8 tones',
        'Direct posting (X, LinkedIn)',
        'AI Humanizer Score',
        'Originality Check',
        'Post history (30 days)',
        '10 content ideas / day',
        '7-day post analytics',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Pro',
      price: '$18',
      altPrice: '\u20B91,499',
      period: '/mo',
      features: [
        'Everything in Starter, plus:',
        '200 AI generations / month',
        'Unlimited Regenerate / Enhance / Humanize',
        'Post scheduling',
        'Unlimited templates',
        'Post history (unlimited)',
        'Unlimited content ideas',
        '30-day analytics + trends',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
  ],
  yearly: [
    {
      name: 'Free',
      price: 'Free',
      period: 'forever',
      features: [
        '10 AI generations / month',
        '3 platforms',
        'Basic tones (Professional, Casual, Educational)',
        'Copy to clipboard only',
        'Community templates',
        '3 content ideas / day',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Starter',
      price: '$5',
      altPrice: '\u20B9399',
      period: '/mo',
      periodNote: 'billed annually',
      features: [
        'Everything in Free, plus:',
        '50 AI generations / month',
        'All platforms',
        'All 8 tones',
        'Direct posting (X, LinkedIn)',
        'AI Humanizer Score',
        'Originality Check',
        'Post history (30 days)',
        '10 content ideas / day',
        '7-day post analytics',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Pro',
      price: '$14',
      altPrice: '\u20B91,199',
      period: '/mo',
      periodNote: 'billed annually',
      features: [
        'Everything in Starter, plus:',
        '200 AI generations / month',
        'Unlimited Regenerate / Enhance / Humanize',
        'Post scheduling',
        'Unlimited templates',
        'Post history (unlimited)',
        'Unlimited content ideas',
        '30-day analytics + trends',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── Hero mock dashboard card ───────────────────────────────────────────────
function HeroMockUI() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => (a + 1) % PLATFORM_DEMOS.length),
      3200,
    )
    return () => clearInterval(id)
  }, [])

  const demo = PLATFORM_DEMOS[active]
  const Icon = demo.Icon

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl shadow-black/70"
      style={{
        background: 'rgba(12,12,20,0.95)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow:
          '0 0 0 1px rgba(139,92,246,0.1), 0 32px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.12)' }}
      >
        <span className="text-xs text-muted font-mono tracking-wide">
          ai_generated_post.txt
        </span>
        <div className="flex gap-1.5">
          {PLATFORM_DEMOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i === active ? '#8b5cf6' : '#3f3f46' }}
            />
          ))}
        </div>
      </div>

      {/* Platform header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: `${demo.color}18`,
            border: `1px solid ${demo.color}35`,
          }}
        >
          <Icon size={14} style={{ color: demo.color }} />
        </div>
        <span className="text-sm font-medium text-text">{demo.platform}</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Ready to post
        </div>
      </div>

      {/* Content body */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-4 pb-3 text-sm text-text leading-relaxed min-h-[80px]"
      >
        {demo.content}
      </motion.div>

      {/* Footer actions */}
      <div
        className="flex items-center justify-between px-4 pb-4 pt-2"
        style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
      >
        <div className="flex gap-3 text-xs text-muted">
          <span>{'\u2728'} Enhance</span>
          <span>{'\uD83D\uDD01'} Regenerate</span>
        </div>
        <div
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}
        >
          Post Now
        </div>
      </div>
    </div>
  )
}

// ─── Feature card ───────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, gradient, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col gap-4 p-6 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient }}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <h3
          className="font-heading font-semibold text-heading text-base mb-1.5"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>
      {/* Top highlight on hover */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)',
        }}
      />
      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ border: '1px solid rgba(139,92,246,0.25)' }}
      />
    </motion.div>
  )
}

// ─── Pricing card ───────────────────────────────────────────────────────────
function PricingCard({ plan, index, onUpgrade }) {
  const [loading, setLoading] = useState(false)

  function handleClick(e) {
    if (onUpgrade && plan.name !== 'Free') {
      e.preventDefault()
      setLoading(true)
      onUpgrade(plan.name.toLowerCase(), () => setLoading(false))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        delay: index * 0.12,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -8,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      className={`relative flex flex-col rounded-2xl p-8 ${
        plan.popular ? 'z-10' : ''
      }`}
      style={{
        background: plan.popular
          ? 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(5,5,8,0.98) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: plan.popular
          ? '1px solid rgba(139,92,246,0.4)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: plan.popular
          ? '0 0 40px rgba(139,92,246,0.15), 0 24px 48px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
          }}
        >
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6 min-h-[120px]">
        <h3
          className="font-heading text-lg font-semibold text-heading mb-3"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-heading text-4xl font-bold text-heading"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {plan.price}
          </span>
          {plan.period !== 'forever' && (
            <span className="text-muted text-sm">{plan.period}</span>
          )}
        </div>
        {plan.altPrice ? (
          <p className="text-muted text-xs mt-1.5">
            or {plan.altPrice}
            {plan.period}
          </p>
        ) : (
          <p className="text-xs mt-1.5">&nbsp;</p>
        )}
        {plan.periodNote ? (
          <p className="text-amber text-xs mt-1">{plan.periodNote}</p>
        ) : (
          <p className="text-xs mt-1">&nbsp;</p>
        )}
      </div>

      {/* Feature list */}
      <ul className="flex-1 flex flex-col gap-3 mb-8">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-text">
            <Check size={15} className="text-amber mt-0.5 flex-shrink-0" />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA — pinned to bottom via mt-auto */}
      <div className="mt-auto">
        {onUpgrade && plan.name !== 'Free' ? (
          <button
            onClick={handleClick}
            disabled={loading}
            className="block w-full py-3 rounded-xl text-center font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            style={{
              background: plan.popular
                ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                : 'rgba(255,255,255,0.06)',
              color: plan.popular ? '#fff' : '#d4d4e8',
              border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: plan.popular
                ? '0 0 20px rgba(139,92,246,0.3)'
                : 'none',
            }}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              plan.cta
            )}
          </button>
        ) : (
          <Link
            to={onUpgrade ? '/dashboard' : '/register'}
            className="block w-full py-3 rounded-xl text-center font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.97]"
            style={{
              background: plan.popular
                ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                : 'rgba(255,255,255,0.06)',
              color: plan.popular ? '#fff' : '#d4d4e8',
              border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: plan.popular
                ? '0 0 20px rgba(139,92,246,0.3)'
                : 'none',
            }}
          >
            {plan.cta}
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ─── Trust badge ────────────────────────────────────────────────────────────
function TrustBadge({ icon: Icon, text }) {
  return (
    <div
      className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm text-text"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Icon size={16} className="text-amber flex-shrink-0" />
      {text}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function Landing() {
  const [billing, setBilling] = useState('monthly')
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  // Currency detection for Razorpay
  const detectCurrency = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
      return tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta') ? 'INR' : 'USD'
    } catch {
      return 'INR'
    }
  }

  // Razorpay upgrade handler for authenticated users
  const handlePricingUpgrade = isAuthenticated
    ? (planName, onDone) => {
        openRazorpayCheckout({
          plan: planName,
          billingCycle: billing,
          currency: detectCurrency(),
          user,
          onSuccess: () => {
            onDone?.()
            toast.success(`Welcome to ${planName.charAt(0).toUpperCase() + planName.slice(1)}! Redirecting to dashboard...`)
            setTimeout(() => { window.location.href = '/dashboard' }, 1500)
          },
          onError: (err) => {
            onDone?.()
            toast.error(typeof err === 'string' ? err : 'Payment failed. Please try again.')
          },
        })
      }
    : null

  // Refs
  const orb1 = useRef(null)
  const orb2 = useRef(null)
  const orb3 = useRef(null)
  const stepsRef = useRef(null)
  const pricingRef = useRef(null)

  // ── Scroll to #pricing from route ─────────────────────────────────────────
  useEffect(() => {
    if (location.hash === '#pricing' || location.pathname === '/pricing') {
      setTimeout(() => {
        pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [location])

  // ── Floating orbs ─────────────────────────────────────────────────────────
  useEffect(() => {
    gsap.to(orb1.current, {
      y: -40,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
    gsap.to(orb2.current, {
      y: 30,
      duration: 6.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.2,
    })
    gsap.to(orb3.current, {
      y: -20,
      x: 15,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5,
    })
  }, [])

  // ── GSAP ScrollTrigger for How-It-Works steps ─────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = stepsRef.current?.querySelectorAll('.step-card')
      if (!cards?.length) return

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.18,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          },
        )
      })
    })
    return () => ctx.revert()
  }, [])

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const plans = PLANS[billing]

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      {/* ═════════════════════════════════════════════════════════════════════
         NAVBAR
         ═════════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          background: 'rgba(5,5,8,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(139,92,246,0.1)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              boxShadow: '0 0 16px rgba(139,92,246,0.4)',
            }}
          >
            <img
              src="/logo.png"
              alt="PostPilot"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <span
            className="font-heading font-semibold text-heading text-[15px]"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            PostPilot
          </span>
        </div>

        {/* Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted">
          <button
            onClick={() => scrollTo('features')}
            className="hover:text-text transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('pricing')}
            className="hover:text-text transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="hover:text-text transition-colors cursor-pointer"
          >
            How It Works
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                boxShadow: '0 0 14px rgba(139,92,246,0.35)',
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm text-muted hover:text-text transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  boxShadow: '0 0 14px rgba(139,92,246,0.35)',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ═════════════════════════════════════════════════════════════════════
         HERO
         ═════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Animated gradient mesh orbs */}
        <div
          ref={orb1}
          className="absolute pointer-events-none"
          style={{
            width: 700,
            height: 700,
            top: '5%',
            left: '-15%',
            background:
              'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
        <div
          ref={orb2}
          className="absolute pointer-events-none"
          style={{
            width: 600,
            height: 600,
            bottom: '5%',
            right: '-12%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
        <div
          ref={orb3}
          className="absolute pointer-events-none"
          style={{
            width: 300,
            height: 300,
            top: '30%',
            right: '20%',
            background:
              'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.018]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-8"
          style={{
            borderColor: 'rgba(139,92,246,0.35)',
            color: '#a78bfa',
            background: 'rgba(139,92,246,0.08)',
          }}
        >
          <Sparkles size={11} />
          Powered by Claude AI &middot; Built for Creators
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="font-heading font-bold leading-[1.08] tracking-tight max-w-4xl mb-6"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
          }}
        >
          One Idea.{' '}
          <span
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Every Platform.
          </span>
          <br />
          Zero Effort
          <span className="text-amber">.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-muted text-lg max-w-xl mb-10 leading-relaxed"
        >
          AI-powered content engine that crafts, optimizes, and publishes your
          posts across X, LinkedIn, Instagram, WhatsApp, and more.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-16"
        >
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              boxShadow: '0 0 28px rgba(139,92,246,0.45)',
            }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
            <ArrowRight size={15} />
          </Link>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-text text-sm transition-all hover:bg-white/[0.06] cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
            }}
          >
            See How It Works
          </button>
        </motion.div>

        {/* Mock dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.58,
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <HeroMockUI />
        </motion.div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         PLATFORM STRIP — infinite scroll
         ═════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-10 overflow-hidden"
        style={{
          borderTop: '1px solid rgba(139,92,246,0.1)',
          borderBottom: '1px solid rgba(139,92,246,0.1)',
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <p className="text-center text-muted text-sm mb-8 tracking-wide">
          Generate platform-perfect posts in seconds
        </p>
        <div className="landing-scroll-mask">
          <div className="landing-platform-scroll flex items-center gap-14">
            {[...STRIP_PLATFORMS, ...STRIP_PLATFORMS, ...STRIP_PLATFORMS].map(
              ({ Icon, name, color }, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex items-center gap-3 shrink-0"
                >
                  <Icon size={22} style={{ color }} />
                  <span className="text-text text-sm whitespace-nowrap font-medium">
                    {name}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         HOW IT WORKS
         ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-28 px-4"
        style={{ background: 'rgba(139,92,246,0.025)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">
              How It Works
            </p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-5"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Three steps to everywhere
            </h2>
            <div
              className="mx-auto"
              style={{
                width: 60,
                height: 3,
                borderRadius: 99,
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              }}
            />
          </div>

          <div
            ref={stepsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative"
          >
            {STEPS.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="step-card flex flex-col items-center text-center gap-4"
              >
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      boxShadow: '0 0 24px rgba(139,92,246,0.12)',
                    }}
                  >
                    <Icon size={24} className="text-amber" />
                  </div>
                  <div
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
                    style={{
                      background:
                        'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                <div>
                  <h3
                    className="font-heading font-semibold text-heading text-lg mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed max-w-[240px]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         KEY FEATURES
         ═════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">
              Features
            </p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Everything you need to dominate
            </h2>
            <p className="text-muted text-base max-w-md mx-auto leading-relaxed">
              From AI generation to one-click publishing &mdash; PostPilot
              handles your entire content workflow end to end.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         PRICING
         ═════════════════════════════════════════════════════════════════════ */}
      <section
        id="pricing"
        ref={pricingRef}
        className="py-28 px-4"
        style={{
          borderTop: '1px solid rgba(139,92,246,0.1)',
          background: 'rgba(139,92,246,0.025)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">
              Pricing
            </p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-muted text-base max-w-md mx-auto leading-relaxed mb-8">
              Start free, scale as you grow. No hidden fees.
            </p>

            {/* Billing toggle */}
            <div
              className="inline-flex items-center gap-3 p-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <button
                onClick={() => setBilling('monthly')}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer"
                style={{
                  background:
                    billing === 'monthly'
                      ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                      : 'transparent',
                  color: billing === 'monthly' ? '#fff' : '#6b7280',
                  boxShadow:
                    billing === 'monthly'
                      ? '0 4px 14px rgba(139,92,246,0.3)'
                      : 'none',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
                style={{
                  background:
                    billing === 'yearly'
                      ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                      : 'transparent',
                  color: billing === 'yearly' ? '#fff' : '#6b7280',
                  boxShadow:
                    billing === 'yearly'
                      ? '0 4px 14px rgba(139,92,246,0.3)'
                      : 'none',
                }}
              >
                Yearly
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background:
                      billing === 'yearly'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(139,92,246,0.15)',
                    color: billing === 'yearly' ? '#fff' : '#a78bfa',
                  }}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4">
            {plans.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} index={i} onUpgrade={handlePricingUpgrade} />
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         SOCIAL PROOF / TRUST
         ═════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">
              Trusted by Creators
            </p>
            <h2
              className="font-heading text-3xl md:text-4xl font-bold text-heading mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Built for developers, creators, and professionals
            </h2>
            <p className="text-muted text-base mb-10 leading-relaxed">
              Join 100+ creators already using PostPilot to streamline their
              social media workflow.
            </p>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <TrustBadge icon={Sparkles} text="Powered by Claude AI" />
            <TrustBadge icon={Shield} text="Your data stays yours" />
            <TrustBadge icon={CreditCard} text="No credit card required" />
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         FINAL CTA
         ═════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-28 px-4"
        style={{
          borderTop: '1px solid rgba(139,92,246,0.1)',
          background: 'rgba(5,5,8,0.6)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(139,92,246,0.08) 50%, rgba(5,5,8,1) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
              }}
            />

            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-5">
              Start Today &middot; It&apos;s Free
            </p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-5 leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Your content,
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                everywhere at once.
              </span>
            </h2>
            <p className="text-muted text-base mb-10 max-w-sm mx-auto leading-relaxed">
              Stop writing the same thing five times. Let AI handle the heavy
              lifting while you focus on what actually matters.
            </p>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-xl font-semibold text-white text-base transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                boxShadow: '0 0 40px rgba(139,92,246,0.5)',
              }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
              <ArrowRight size={17} />
            </Link>
            {!isAuthenticated && (
              <p className="text-muted text-xs mt-5">
                No credit card required &middot; Takes 30 seconds
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
         FOOTER
         ═════════════════════════════════════════════════════════════════════ */}
      <footer
        style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
        className="py-12 px-6"
      >
        <div className="max-w-5xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-[8px] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                }}
              >
                <img
                  src="/logo.png"
                  alt="PostPilot"
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className="font-heading font-semibold text-heading text-sm"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                PostPilot
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
              <button
                onClick={() => scrollTo('features')}
                className="hover:text-text transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="hover:text-text transition-colors cursor-pointer"
              >
                Pricing
              </button>
              {isAuthenticated ? (
                <Link to="/dashboard" className="hover:text-text transition-colors">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="hover:text-text transition-colors">Login</Link>
                  <Link to="/register" className="hover:text-text transition-colors">Sign Up</Link>
                </>
              )}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/tabcrypt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-text transition-colors"
                aria-label="Follow on X"
              >
                <FaTwitter size={16} />
              </a>
              <a
                href="https://linkedin.com/in/tabcrypt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-text transition-colors"
                aria-label="Follow on LinkedIn"
              >
                <FaLinkedin size={16} />
              </a>
            </div>
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-sm text-muted">
            <Link to="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-text transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-text transition-colors">Cookie Policy</Link>
            <Link to="/acceptable-use" className="hover:text-text transition-colors">Acceptable Use</Link>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-6"
            style={{ background: 'rgba(139,92,246,0.08)' }}
          />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
            <p>
              Built by{' '}
              <a
                href="https://tabcrypt.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber hover:underline"
              >
                TabCrypt
              </a>
            </p>
            <p>&copy; {new Date().getFullYear()} PostPilot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
