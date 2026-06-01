import { getActiveView } from '@/lib/views'

export default function AppNav() {
  const view = getActiveView()
  return (
    <nav className="flex items-center gap-4 border-b border-current/10 px-6 py-3">
      <span className="font-semibold tracking-tight">Logos CRM</span>
      <span className="text-sm opacity-60">{view.label}</span>
    </nav>
  )
}
