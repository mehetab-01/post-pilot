import { useState, useEffect } from 'react'
import { CreditCard, Zap, Crown, Calendar, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUsage } from '@/contexts/UsageContext'
import { getBillingStatus, cancelPlan } from '@/services/billing'

const PLAN_COLORS = {
  free:    { bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.25)', text: '#a1a1aa', label: 'Free' },
  starter: { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.35)',  text: '#a78bfa', label: 'Starter' },
  pro:     { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.35)',  text: '#fbbf24', label: 'Pro' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAmount(amount, currency) {
  if (!amount) return '—'
  const value = amount / 100
  return currency === 'USD' ? `$${value.toFixed(2)}` : `₹${value.toLocaleString('en-IN')}`
}

export function BillingSection() {
  const { plan, fetchUsage } = useUsage()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    getBillingStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel your plan? You\'ll keep access until the current period ends.')) return
    setCancelling(true)
    try {
      const res = await cancelPlan()
      toast.success(res.message || 'Plan cancelled.')
      // Refresh status
      const updated = await getBillingStatus()
      setStatus(updated)
      fetchUsage()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to cancel plan.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-center h-[120px]">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    )
  }

  const planKey = plan || 'free'
  const colors = PLAN_COLORS[planKey] || PLAN_COLORS.free
  const isFree = planKey === 'free'
  const PlanIcon = planKey === 'pro' ? Crown : planKey === 'starter' ? Zap : CreditCard

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Current plan header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
          >
            <PlanIcon size={16} style={{ color: colors.text }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-heading">{colors.label} Plan</span>
              {status?.plan_cancelled && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/50 text-red-400 border border-red-900/40">
                  Cancelling
                </span>
              )}
            </div>
            {!isFree && status?.billing_cycle && (
              <p className="text-[11px] text-muted mt-0.5">
                Billed {status.billing_cycle}
              </p>
            )}
          </div>
        </div>

        {!isFree && !status?.plan_cancelled && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-950/30 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Plan'}
          </button>
        )}
      </div>

      {/* Plan details */}
      <div className="px-5 py-4">
        {isFree ? (
          <p className="text-sm text-muted">
            You are on the free plan with 10 generations per month. Upgrade to unlock all features.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Started</p>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-muted" />
                <span className="text-sm text-text">{formatDate(status?.plan_started_at)}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                {status?.plan_cancelled ? 'Access Until' : 'Renews On'}
              </p>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-muted" />
                <span className="text-sm text-text">{formatDate(status?.plan_expires_at)}</span>
              </div>
            </div>
            {status?.last_payment_amount && (
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Last Payment</p>
                <span className="text-sm text-text font-medium">
                  {formatAmount(status.last_payment_amount, status.last_payment_currency)}
                </span>
              </div>
            )}
          </div>
        )}

        {status?.plan_cancelled && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-950/20 border border-red-900/30">
            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300 leading-relaxed">
              Your plan is cancelled and will downgrade to Free on {formatDate(status.plan_expires_at)}.
            </p>
          </div>
        )}
      </div>

      {/* Payment history */}
      {status?.payments?.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }}>
          <div className="px-5 py-3">
            <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Payment History</p>
          </div>
          <div className="px-5 pb-4 space-y-2 max-h-[200px] overflow-y-auto">
            {status.payments
              .filter(p => p.status === 'paid')
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div>
                    <span className="text-xs text-text font-medium">
                      {p.plan?.charAt(0).toUpperCase()}{p.plan?.slice(1)} — {p.billing_cycle}
                    </span>
                    <p className="text-[10px] text-muted">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text font-semibold">
                      {formatAmount(p.amount, p.currency)}
                    </span>
                    <p className="text-[10px] text-green-400">Paid</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
