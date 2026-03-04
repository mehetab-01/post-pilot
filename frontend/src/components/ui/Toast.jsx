// Custom toast helper — wraps react-hot-toast with PostPilot styling.
// Import and call these instead of toast() directly.
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

const iconStyle = { flexShrink: 0 }

export const notify = {
  success: (msg) =>
    toast.custom(() => (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-surface border-border text-text text-sm shadow-xl shadow-black/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <CheckCircle size={18} color="#8b5cf6" style={iconStyle} />
        <span>{msg}</span>
      </div>
    )),

  error: (msg) =>
    toast.custom(() => (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-surface border-red-900 text-text text-sm shadow-xl shadow-black/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <XCircle size={18} color="#f87171" style={iconStyle} />
        <span>{msg}</span>
      </div>
    )),

  info: (msg) =>
    toast.custom(() => (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-surface border-border text-text text-sm shadow-xl shadow-black/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Info size={18} color="#71717a" style={iconStyle} />
        <span>{msg}</span>
      </div>
    )),

  warning: (msg) =>
    toast.custom(() => (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-surface border-amber/40 text-text text-sm shadow-xl shadow-black/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <AlertTriangle size={18} color="#a78bfa" style={iconStyle} />
        <span>{msg}</span>
      </div>
    )),
}
