import { Check, CheckCheck } from 'lucide-react'

export function WhatsAppPreview({ content }) {
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="rounded-xl px-4 py-5 min-h-[80px]"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'60\' height=\'60\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1.5\' fill=\'%23ffffff06\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'200\' height=\'200\' fill=\'%230b141a\'/%3E%3Crect width=\'200\' height=\'200\' fill=\'url(%23p)\'/%3E%3C/svg%3E")',
        backgroundSize: '60px 60px',
      }}
    >
      {/* Outgoing message bubble */}
      <div className="flex justify-end">
        <div className="relative max-w-[85%]">
          <div className="bg-[#005c4b] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
            <p className="text-[14.2px] text-[#e9edef] leading-[1.35] whitespace-pre-wrap break-words">
              {content}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[11px] text-[#ffffff99]">{time}</span>
              <CheckCheck size={14} className="text-[#53bdeb]" />
            </div>
          </div>
          {/* Bubble tail */}
          <div
            className="absolute -top-0 -right-[8px] w-0 h-0"
            style={{
              borderLeft: '8px solid #005c4b',
              borderTop: '8px solid transparent',
            }}
          />
        </div>
      </div>
    </div>
  )
}
