import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Lock } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()
  const glowRef = useRef(null)

  // Subtle background amber glow animation on mount
  useEffect(() => {
    if (!glowRef.current) return
    gsap.fromTo(
      glowRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }
    )
  }, [])

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
    <div className="relative min-h-screen bg-bg flex items-center justify-center p-4 overflow-hidden">
      {/* Background glow orb */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-[14px] bg-white overflow-hidden mb-4"
              style={{ boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}
            >
              <img src="/logo.png" alt="PostPilot" className="w-full h-full object-contain p-1" />
            </div>
            <h1
              className="text-heading font-heading font-bold text-2xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="text-muted text-sm mt-1">Sign in to your PostPilot account</p>
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

          {/* Footer */}
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

        {/* Subtle corner decorations */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
      </motion.div>
    </div>
  )
}
