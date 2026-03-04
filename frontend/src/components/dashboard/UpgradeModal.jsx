import { motion as Motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, X, Zap, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$9',
    Icon: Zap,
    color: '#8b5cf6',
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
    price: '$19',
    Icon: Crown,
    color: '#f59e0b',
    features: [
      '200 generations / month',
      'Everything in Starter',
      'Scheduling (coming soon)',
      'Unlimited history',
      'Priority support',
    ],
  },
]

export function UpgradeModal({ isOpen, onClose, feature }) {
  const navigate = useNavigate()

  if (!isOpen) return null

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Content */}
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
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-white/5 z-10"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
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

            {/* Plan cards */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl p-4 flex flex-col"
                  style={{
                    background: 'rgba(139, 92, 246, 0.04)',
                    border: `1px solid rgba(139, 92, 246, 0.15)`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <plan.Icon size={16} style={{ color: plan.color }} />
                    <span className="text-sm font-semibold text-heading">{plan.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-heading mb-1">
                    {plan.price}<span className="text-xs text-muted font-normal">/mo</span>
                  </p>
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted">
                        <Sparkles size={10} className="text-amber mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      onClose()
                      navigate('/')
                    }}
                    className="mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: plan.id === 'pro'
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                      color: '#fff',
                    }}
                  >
                    Get {plan.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Dismiss */}
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
