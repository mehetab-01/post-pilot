import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Lock, Sparkles, Zap, Globe, CheckCircle2 } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const FEATURES = [
  { icon: Sparkles, text: 'Claude AI generates platform-perfect posts instantly' },
  { icon: Globe,    text: 'Publish to 5 social networks with one click' },
  { icon: Zap,      text: 'Bring your own API keys — full privacy control' },
]

function LeftPanel() {
  const orb1 = useRef(null)
  const orb2 = useRef(null)

  useEffect(() => {
    gsap.to(orb1.current, { y: -30, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    gsap.to(orb2.current, { y: 25, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 })
  }, [])

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ flex: '0 0 42%', background: 'rgba(7,5,15,0.98)' }}
    >
      {/* Violet orbs */}
      <div
        ref={orb1}
        className="absolute pointer-events-none"
        style={{
          width: 500, height: 500,
          top: '-10%', left: '-20%',
          background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />
      <div
        ref={orb2}
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400,
          bottom: '-5%', right: '-15%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)',
          borderRadius: '50%',
        }}
      />

      {/* Right edge separator */}
      <div
        className="absolute right-0 inset-y-0 w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.25), transparent)' }}
      />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[11px] overflow-hidden flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            boxShadow: '0 0 20px rgba(139,92,246,0.5)',
          }}
        >
          <img src="/logo.png" alt="PostPilot" className="w-full h-full object-contain p-0.5" />
        </div>
        <span className="font-heading font-semibold text-white text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
          PostPilot
        </span>
      </div>

      {/* Main copy */}
      <div className="relative flex flex-col gap-8">
        <div>
          <h2
            className="font-heading font-bold text-4xl text-white leading-tight mb-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Create content for{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              every platform.
            </span>
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            AI-powered posts tailored for Twitter, LinkedIn, Reddit, Instagram & WhatsApp — all at once.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <Icon size={13} className="text-amber" />
              </div>
              <p className="text-text text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="relative">
        <p className="text-muted text-xs">Your keys. Your data. Your control.</p>
      </div>
    </div>
  )
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const e = {}
    if (!username.trim()) e.username = 'Username is required'
    if (!password) e.password = 'Password is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setIsLoading(true)
    setErrors({})
    try {
      await login(username.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials'
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle violet glow behind form */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500, height: 500,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[400px]"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div
              className="w-9 h-9 rounded-[10px] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}
            >
              <img src="/logo.png" alt="PostPilot" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="font-heading font-semibold text-white text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>
              PostPilot
            </span>
          </div>

          {/* Glass card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1
                className="text-heading font-heading font-bold text-2xl mb-1"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Welcome back
              </h1>
              <p className="text-muted text-sm">Sign in to your PostPilot account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Username"
                id="username"
                name="username"
                autoComplete="username"
                icon={User}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                placeholder="your_username"
                autoFocus
              />

              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="••••••••"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-amber hover:text-amber-light transition-colors font-medium"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Top highlight line */}
          <div
            className="absolute -top-px left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
