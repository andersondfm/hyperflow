import { Braces, Network } from 'lucide-react'
import { Views, useViewStore, type ViewId } from '@/store/viewStore'
import { cn } from '@/lib/utils'

const TABS: ReadonlyArray<{ id: ViewId; label: string; short: string }> = [
  { id: Views.Architect, label: 'Arquitetura', short: 'Arq' },
  { id: Views.FullStack, label: 'Full Stack .NET + React', short: 'Full Stack' },
]

export function ViewTabs() {
  const view = useViewStore((s) => s.view)
  const setView = useViewStore((s) => s.setView)

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-0.5">
      {TABS.map((tab) => {
        const active = view === tab.id
        const Icon = tab.id === Views.Architect ? Network : Braces
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            title={tab.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition',
              active
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span className="hidden lg:inline">{tab.label}</span>
            <span className="lg:hidden">{tab.short}</span>
          </button>
        )
      })}
    </div>
  )
}
