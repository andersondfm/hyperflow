import {
  Network,
  DatabaseZap,
  Layers,
  Cylinder,
  Cog,
  Box,
  FlaskConical,
  ScanSearch,
  MailWarning,
  type LucideIcon,
} from 'lucide-react'
import type { DragEvent } from 'react'
import { NODE_PALETTE } from '@/lib/utils'
import { NodeKinds, type NodeKind } from '@/types/nodes'
import { cn } from '@/lib/utils'

const icons: Record<NodeKind, LucideIcon> = {
  [NodeKinds.ApiGateway]: Network,
  [NodeKinds.Redis]: DatabaseZap,
  [NodeKinds.RabbitMQ]: Layers,
  [NodeKinds.Postgres]: Cylinder,
  [NodeKinds.Worker]: Cog,
  [NodeKinds.Container]: Box,
  [NodeKinds.IntegrationTest]: FlaskConical,
  [NodeKinds.Sonar]: ScanSearch,
  [NodeKinds.Dlq]: MailWarning,
}

const accentBg: Record<string, string> = {
  cyan: 'bg-cyan-400/15 text-cyan-300 border-cyan-500/30',
  rose: 'bg-rose-400/15 text-rose-300 border-rose-500/30',
  amber: 'bg-amber-400/15 text-amber-300 border-amber-500/30',
  sky: 'bg-sky-400/15 text-sky-300 border-sky-500/30',
  emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-500/30',
  teal: 'bg-teal-400/15 text-teal-300 border-teal-500/30',
  violet: 'bg-violet-400/15 text-violet-300 border-violet-500/30',
  orange: 'bg-orange-400/15 text-orange-300 border-orange-500/30',
  red: 'bg-red-400/15 text-red-300 border-red-500/30',
}

export function Sidebar() {
  const onDragStart = (event: DragEvent, kind: NodeKind) => {
    event.dataTransfer.setData('application/hyperflow-node', kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80">
      <div className="border-b border-slate-800 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Toolbox
        </p>
        <h2 className="mt-1 font-display text-sm font-semibold text-slate-100">
          Componentes
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Arraste para o canvas e conecte para montar a topologia.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {NODE_PALETTE.map((item) => {
          const Icon = icons[item.kind]
          return (
            <div
              key={item.kind}
              draggable
              onDragStart={(e) => onDragStart(e, item.kind)}
              className={cn(
                'cursor-grab rounded-lg border px-3 py-2.5 transition-all active:cursor-grabbing',
                'hover:border-slate-600 hover:bg-slate-900/80',
                'border-slate-800 bg-slate-900/40',
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border',
                    accentBg[item.accent] ?? accentBg.cyan,
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{item.label}</p>
                  <p className="truncate text-[11px] text-slate-500">{item.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-slate-800 p-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Demo 2 min
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Dispare o pico, suba uma réplica, injete chaos no Postgres e reprocesse a DLQ.
          </p>
        </div>
      </div>
    </aside>
  )
}
