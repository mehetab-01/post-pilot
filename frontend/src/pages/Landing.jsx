import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import {
  Sparkles, Zap, Globe, Clock, ImageIcon,
  Bot, Share2, ArrowRight, CheckCircle2,
} from 'lucide-react'
import {
  FaTwitter, FaLinkedin, FaRedditAlien, FaInstagram, FaWhatsapp,
} from 'react-icons/fa'

// ── Platform pill ──────────────────────────────────────────────────────────────
function PlatformPill({ Icon, name, color }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
      style={{ borderColor: `${color}40`, color, background: `${color}10` }}
    >
      <Icon size={12} />
      {name}
    </div>
  )
}

// ── Animated mock UI card (hero preview) ───────────────────────────────────────
const PLATFORM_DEMOS = [
  {
    platform: 'Twitter',
    color: '#e7e7e7',
    Icon: FaTwitter,
    content: "🚀 Just shipped our AI content engine! It doesn't just write posts — it thinks like your audience. Try PostPilot today.",
  },
  {
    platform: 'LinkedIn',
    color: '#0a66c2',
    Icon: FaLinkedin,
    content: "Excited to announce: after 3 months of building, we've created something that fundamentally changes how founders approach content creation.",
  },
  {
    platform: 'Reddit',
    color: '#ff4500',
    Icon: FaRedditAlien,
    content: "PSA: Stop spending hours writing social posts. I built an AI tool that creates platform-specific content in seconds. AMA in comments!",
  },
]

function HeroMockUI() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % PLATFORM_DEMOS.length), 3200)
    return () => clearInterval(timer)
  }, [])

  const demo = PLATFORM_DEMOS[active]
  const Icon = demo.Icon

  return (
    <div
      className="w-full max-w-sm rounded-2xl border border-border overflow-hidden shadow-2xl shadow-black/60"
      style={{ background: 'rgba(18,18,20,0.92)', backdropFilter: 'blur(20px)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs text-muted font-mono tracking-wide">ai_generated_post.txt</span>
        <div className="flex gap-1.5">
          {PLATFORM_DEMOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i === active ? '#f59e0b' : '#3f3f46' }}
            />
          ))}
        </div>
      </div>

      {/* Platform header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${demo.color}18`, border: `1px solid ${demo.color}35` }}
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
      <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-border/50">
        <div className="flex gap-3 text-xs text-muted">
          <span>✨ Enhance</span>
          <span>🔁 Regenerate</span>
        </div>
        <div
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-900 cursor-pointer"
          style={{ background: '#f59e0b' }}
        >
          Post Now
        </div>
      </div>
    </div>
  )
}

// ── Feature card ───────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, gradient, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-border bg-surface hover:border-amber/30 transition-colors duration-300 overflow-hidden"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient }}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <h3 className="font-heading font-semibold text-heading text-base mb-1.5"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>
      {/* Subtle top highlight on hover */}
      <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />
    </motion.div>
  )
}

// ── How-it-works step ─────────────────────────────────────────────────────────
function Step({ number, title, description, icon: Icon }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: (number - 1) * 0.18, duration: 0.5 }}
      className="flex flex-col items-center text-center gap-4"
    >
      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl bg-surface border border-amber/25 flex items-center justify-center"
          style={{ boxShadow: '0 0 24px rgba(245,158,11,0.1)' }}
        >
          <Icon size={24} className="text-amber" />
        </div>
        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-amber flex items-center justify-center text-zinc-900 font-bold text-xs shadow-lg">
          {number}
        </div>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-heading text-lg mb-2"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </h3>
        <p className="text-muted text-sm leading-relaxed max-w-[200px]">{description}</p>
      </div>
    </motion.div>
  )
}

// ── Platform showcase card ─────────────────────────────────────────────────────
function PlatformShowcaseCard({ Icon, name, color, bg, desc, delay }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
      className="flex flex-col gap-3 p-5 rounded-2xl border cursor-default transition-shadow duration-300"
      style={{
        borderColor: `${color}22`,
        background: `linear-gradient(135deg, ${bg} 0%, rgba(9,9,11,0.95) 100%)`,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <h3 className="font-heading font-semibold text-heading text-base mb-1"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          {name}
        </h3>
        <p className="text-muted text-xs">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs" style={{ color }}>
        <CheckCircle2 size={12} />
        <span>Supported</span>
      </div>
    </motion.div>
  )
}

// ── Animated counter ───────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setValue(target)
        clearInterval(timer)
      } else {
        setValue(Math.floor(current))
      }
    }, 28)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{value}{suffix}</span>
}

// ── Data ───────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Bot,
    title: 'Claude AI Generation',
    description: "Powered by Anthropic's Claude — crafts authentic, context-aware posts tailored to each platform's unique format and audience.",
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    delay: 0,
  },
  {
    icon: Globe,
    title: '5 Platforms at Once',
    description: 'Generate and publish to Twitter, LinkedIn, Reddit, Instagram & WhatsApp simultaneously with a single click.',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    delay: 0.07,
  },
  {
    icon: Sparkles,
    title: '8 Unique Tones',
    description: 'Professional, casual, witty, controversial, inspirational — dial in your exact brand voice for every post.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    delay: 0.14,
  },
  {
    icon: ImageIcon,
    title: 'Rich Media Support',
    description: 'Attach images and videos up to 50MB. Visual context means better, more targeted AI-generated copy.',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    delay: 0.21,
  },
  {
    icon: Clock,
    title: 'Full Post History',
    description: 'Every post you generate is saved. Search, filter, and reuse your best content instantly.',
    gradient: 'linear-gradient(135deg, #10b981, #047857)',
    delay: 0.28,
  },
  {
    icon: Zap,
    title: 'Instant Publishing',
    description: 'Review your generated content, tweak if needed, then hit publish — all platforms receive your post in seconds.',
    gradient: 'linear-gradient(135deg, #f97316, #c2410c)',
    delay: 0.35,
  },
]

const PLATFORMS = [
  { Icon: FaTwitter,    name: 'Twitter / X',  color: '#e7e7e7', bg: '#0d0d0d', desc: 'Perfect tweets & viral threads' },
  { Icon: FaLinkedin,   name: 'LinkedIn',      color: '#0a66c2', bg: '#020e1a', desc: 'Professional posts & thought leadership' },
  { Icon: FaRedditAlien, name: 'Reddit',       color: '#ff4500', bg: '#180800', desc: 'Community discussions & AMAs' },
  { Icon: FaInstagram,  name: 'Instagram',     color: '#e1306c', bg: '#160008', desc: 'Captions & copy ready to paste' },
  { Icon: FaWhatsapp,   name: 'WhatsApp',      color: '#25d366', bg: '#001508', desc: 'Messages & broadcast content' },
]

const STEPS = [
  {
    number: 1,
    icon: Bot,
    title: 'Describe your idea',
    description: 'Type what you want to post about. Plain language. No prompting expertise needed.',
  },
  {
    number: 2,
    icon: Sparkles,
    title: 'AI crafts your posts',
    description: 'Claude generates platform-perfect content with the right tone, length, and format for each network.',
  },
  {
    number: 3,
    icon: Share2,
    title: 'Publish everywhere',
    description: 'Review, edit if needed, then post to all selected platforms simultaneously.',
  },
]

// ── Main Landing page ──────────────────────────────────────────────────────────
export default function Landing() {
  const orb1 = useRef(null)
  const orb2 = useRef(null)
  const orb3 = useRef(null)

  useEffect(() => {
    gsap.to(orb1.current, { y: -40, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    gsap.to(orb2.current, { y: 30, duration: 6.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2 })
    gsap.to(orb3.current, { y: -20, x: 15, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 })
  }, [])

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          background: 'rgba(9,9,11,0.82)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(39,39,42,0.5)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] bg-white overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 0 16px rgba(245,158,11,0.4)' }}
          >
            <img src="/logo.png" alt="PostPilot" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="font-heading font-semibold text-heading text-[15px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            PostPilot
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:block text-sm text-muted hover:text-text transition-colors px-4 py-2 rounded-lg hover:bg-surface"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold text-zinc-900 px-4 py-2 rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
            style={{ background: '#f59e0b', boxShadow: '0 0 14px rgba(245,158,11,0.3)' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Background orbs */}
        <div
          ref={orb1}
          className="absolute pointer-events-none"
          style={{
            width: 600, height: 600,
            top: '5%', left: '-10%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
        <div
          ref={orb2}
          className="absolute pointer-events-none"
          style={{
            width: 500, height: 500,
            bottom: '5%', right: '-8%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />
        <div
          ref={orb3}
          className="absolute pointer-events-none"
          style={{
            width: 300, height: 300,
            top: '30%', right: '20%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.018]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
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
            borderColor: 'rgba(245,158,11,0.35)',
            color: '#f59e0b',
            background: 'rgba(245,158,11,0.08)',
          }}
        >
          <Sparkles size={11} />
          Powered by Claude AI · Built for Creators
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading font-bold leading-[1.08] tracking-tight max-w-4xl mb-6"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          }}
        >
          Turn Ideas Into{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 45%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Viral Posts
          </span>
          <span className="text-amber"> ✦</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-muted text-lg max-w-xl mb-10 leading-relaxed"
        >
          AI-generated, platform-optimized content for Twitter, LinkedIn, Reddit,
          Instagram & WhatsApp — crafted in seconds, posted with one click.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-16"
        >
          <Link
            to="/register"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-zinc-900 text-sm transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 0 28px rgba(245,158,11,0.35)',
            }}
          >
            Get Started Free
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-text text-sm border border-border hover:border-zinc-600 hover:bg-surface transition-all"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Mock UI preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.58, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroMockUI />
        </motion.div>

        {/* Platform pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-10"
        >
          <PlatformPill Icon={FaTwitter}     name="Twitter"   color="#e7e7e7" />
          <PlatformPill Icon={FaLinkedin}    name="LinkedIn"  color="#0a66c2" />
          <PlatformPill Icon={FaRedditAlien} name="Reddit"    color="#ff4500" />
          <PlatformPill Icon={FaInstagram}   name="Instagram" color="#e1306c" />
          <PlatformPill Icon={FaWhatsapp}    name="WhatsApp"  color="#25d366" />
        </motion.div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div
        className="border-y border-border py-8 px-4"
        style={{ background: 'rgba(24,24,27,0.7)' }}
      >
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 5,  suffix: '',    label: 'Platforms' },
            { target: 8,  suffix: '',    label: 'Tone Modes' },
            { target: 50, suffix: ' MB', label: 'Max Media' },
            { target: 0,  suffix: '',    label: '', custom: 'Fast' },
          ].map(({ target, suffix, label, custom }) => (
            <div key={label || custom} className="flex flex-col items-center gap-1.5">
              <span
                className="font-heading font-bold text-3xl"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {custom ?? <><Counter target={target} />{suffix}</>}
              </span>
              <span className="text-muted text-xs tracking-wide">{custom ? 'Setup' : label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">What's inside</p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Everything you need to dominate
            </h2>
            <p className="text-muted text-base max-w-md mx-auto leading-relaxed">
              From AI generation to one-click publishing — PostPilot handles your entire content workflow end to end.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat) => (
              <FeatureCard key={feat.title} {...feat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-4 border-y border-border"
        style={{ background: 'rgba(18,18,20,0.5)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">How It Works</p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Three steps to everywhere
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connector line — desktop */}
            <div
              className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.25), transparent)' }}
            />
            {STEPS.map((step) => (
              <Step key={step.number} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Showcase ────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-4">Platforms</p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Post Everywhere
            </h2>
            <p className="text-muted text-base">
              One tool to rule your entire social media presence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map(({ Icon, name, color, bg, desc }, i) => (
              <PlatformShowcaseCard
                key={name}
                Icon={Icon}
                name={name}
                color={color}
                bg={bg}
                desc={desc}
                delay={i * 0.07}
              />
            ))}

            {/* BYOK card — addresses the "API key complexity" concern */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex flex-col gap-3 p-5 rounded-2xl border border-dashed"
              style={{ borderColor: 'rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.04)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-amber/10 border border-amber/25 flex items-center justify-center">
                <Sparkles size={22} className="text-amber" />
              </div>
              <div>
                <h3
                  className="font-heading font-semibold text-heading text-base mb-1"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Bring Your Own Keys
                </h3>
                <p className="text-muted text-xs leading-relaxed">
                  Use your own API keys for full control. Your data stays on your server — zero vendor lock-in, complete privacy.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber">
                <Zap size={12} />
                Privacy first
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-4 border-t border-border"
        style={{ background: 'rgba(14,14,16,0.6)' }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-amber/18 p-12 md:p-16 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(9,9,11,1) 100%)',
            }}
          >
            {/* Top glow */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' }}
            />

            <p className="text-amber text-xs font-semibold tracking-[0.18em] uppercase mb-5">
              Start Today · It&apos;s Free
            </p>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold text-heading mb-5 leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Your content,
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
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
              to="/register"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-xl font-semibold text-zinc-900 text-base transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 0 40px rgba(245,158,11,0.4)',
              }}
            >
              Start for Free
              <ArrowRight size={17} />
            </Link>
            <p className="text-muted text-xs mt-5">No credit card required · Takes 30 seconds</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[7px] bg-white overflow-hidden">
              <img src="/logo.png" alt="PostPilot" className="w-full h-full object-contain" />
            </div>
            <span className="text-muted text-sm font-medium">PostPilot</span>
          </div>
          <p className="text-muted text-xs">AI-powered social media content generation</p>
          <div className="flex items-center gap-5 text-xs text-muted">
            <Link to="/login"    className="hover:text-text transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-text transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
