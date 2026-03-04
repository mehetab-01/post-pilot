import { billingApi } from './api'

export const createOrder    = (plan, billingCycle, currency) => billingApi.createOrder(plan, billingCycle, currency).then(r => r.data)
export const verifyPayment  = (data) => billingApi.verifyPayment(data).then(r => r.data)
export const getBillingStatus = () => billingApi.getStatus().then(r => r.data)
export const cancelPlan     = () => billingApi.cancel().then(r => r.data)

/**
 * Open Razorpay checkout popup.
 * @param {Object} params
 * @param {string} params.plan          – 'starter' | 'pro'
 * @param {string} params.billingCycle  – 'monthly' | 'yearly'
 * @param {string} params.currency      – 'INR' | 'USD'
 * @param {Object} params.user          – { username, email }
 * @param {Function} params.onSuccess   – (verifyResult) => void
 * @param {Function} params.onError     – (error) => void
 */
export async function openRazorpayCheckout({ plan, billingCycle, currency = 'INR', user, onSuccess, onError }) {
  try {
    // 1. Create order on backend
    const order = await createOrder(plan, billingCycle, currency)

    // 2. Build Razorpay options
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
    const cycleLabel = billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)

    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'PostPilot',
      description: `${planLabel} Plan — ${cycleLabel}`,
      order_id: order.order_id,
      handler: async function (response) {
        try {
          const result = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
            billing_cycle: billingCycle,
          })
          onSuccess?.(result)
        } catch (err) {
          onError?.(err?.response?.data?.detail ?? 'Payment verification failed')
        }
      },
      prefill: {
        name: user?.username ?? '',
        email: user?.email ?? '',
      },
      theme: {
        color: '#7c3aed',
      },
      modal: {
        ondismiss: () => {
          // user closed the popup without paying
        },
      },
    }

    // 3. Open checkout
    // eslint-disable-next-line no-undef
    const rzp = new Razorpay(options)
    rzp.on('payment.failed', (resp) => {
      onError?.(resp.error?.description ?? 'Payment failed')
    })
    rzp.open()
  } catch (err) {
    onError?.(err?.response?.data?.detail ?? 'Could not create order')
  }
}
