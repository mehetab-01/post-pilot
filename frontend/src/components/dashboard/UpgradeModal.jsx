import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, X, Zap, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useUsage } from '@/contexts/UsageContext'
import { openRazorpayCheckout } from '@/services/billing'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    Icon: Zap,
    color: '#8b5cf6',
    inr: { monthly: '₹499', yearly: '₹399' },
    usd: { monthly: '$6', yearly: '$5' },
    features: [
      '50 generations / month',
      'All 5 platforms',
      'All 8 tones',
      'Direct posting',
      'AI Humanizer + Originality',
      '30-day history',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    Icon: Crown,
    color: '#f59e0b',
    inr: { monthly: '₹1,499', yearly: '₹1,199' },
    usd: { monthly: '$18', yearly: '$14' },
    features: [
      '200 generations / month',
      'Everything in Starter',
      'Scheduling (coming soon)',
      'Unlimited history',
      'Priority support',
    ],
  },
]

function detectCurrency() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    return tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta') ? 'INR' : 'USD'
  } catch {
    return 'INR'
  }
}

export function UpgradeModal({ isOpen, onClose, feature }) {
  const { user } = useAuth()
  const { fetchUsage } = useUsage()
  const [cycle, setCycle] = useState('monthly')
  const [loading, setLoading] = useState(null) // plan id being processed
  const currency = detectCurrency()

  if (!isOpen) return null

  function handleUpgrade(plan) {
    setLoading(plan.id)
    openRazorpayCheckout({
      plan: plan.id,
      billingCycle: cycle,
      currency,
      user,
      onSuccess: (result) => {
        setLoading(null)
        toast.success(`Welcome to ${result.plan?.charAt(0).toUpperCase()}${result.plan?.slice(1)}! All features unlocked.`)
        fetchUsage()
        onClose()
      },
      onError: (err) => {
        setLoading(null)
        toast.error(typeof err === 'string' ? err : 'Payment failed. Please try again.')
      },
    })
  }

  const priceKey = currency === 'USD' ? 'usd' : 'inr'

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <Motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15, 15, 20, 0.98)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.12)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-white/5 z-10"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-3 text-center">
              <div
                className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
              >
                <Lock size={20} className="text-amber" />
              </div>
              <h2 className="text-xl font-bold text-heading font-heading mb-2">
                Upgrade to Unlock
              </h2>
              {feature && (
                <p className="text-sm text-muted">
                  <span className="text-amber font-medium">{feature}</span> requires a paid plan.
                </p>
              )}
            </div>

            {/* Billing cycle toggle */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setCycle('monthly')}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: cycle === 'monthly' ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'transparent',
                    color: cycle === 'monthly' ? '#fff' : '#6b7280',
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle('yearly')}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: cycle === 'yearly' ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'transparent',
                    color: cycle === 'yearly' ? '#fff' : '#6b7280',
                  }}
                >
                  Yearly
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>-20%</span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl p-4 flex flex-col"
                  style={{
                    background: 'rgba(139, 92, 246, 0.04)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <plan.Icon size={16} style={{ color: plan.color }} />
                    <span className="text-sm font-semibold text-heading">{plan.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-heading mb-1">
                    {plan[priceKey][cycle]}<span className="text-xs text-muted font-normal">/mo</span>
                  </p>
                  {cycle === 'yearly' && (
                    <p className="text-[10px] text-amber">billed annually</p>
                  )}
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted">
                        <Sparkles size={10} className="text-amber mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={!!loading}
                    className="mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{
                      background: plan.id === 'pro'
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                      color: '#fff',
                    }}
                  >
                    {loading === plan.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 text-center">
              <button
                onClick={onClose}
                className="text-xs text-muted hover:text-text transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
