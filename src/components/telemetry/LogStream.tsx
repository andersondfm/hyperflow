import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import type { SimulationLog } from '@/types/nodes'

const levelStyles: Record<SimulationLog['level'], string> = {
  info: 'text-slate-400',
  warn: 'text-amber-300',
  error: 'text-rose-300',
  success: 'text-emerald-300',
}

const levelBadge: Record<SimulationLog['level'], string> = {
  info: 'bg-slate-700 text-slate-300',
  warn: 'bg-amber-500/20 text-amber-300',
  error: 'bg-rose-500/20 text-rose-300',
  success: 'bg-emerald-500/20 text-emerald-300',
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function LogStream() {
  const logs = useSimulationStore((s) => s.logs)

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Event Log
        </p>
        <span className="font-mono text-[10px] text-slate-600">{logs.length} eventos</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 font-mono text-[11px]">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex gap-2 rounded px-1.5 py-1 hover:bg-slate-800/40"
          >
            <span className="shrink-0 text-slate-600">{formatTime(log.timestamp)}</span>
            <span
              className={cn(
                'shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase',
                levelBadge[log.level],
              )}
            >
              {log.level}
            </span>
            <span className="shrink-0 text-cyan-600/80">{log.source}</span>
            <span className={cn('min-w-0 break-words', levelStyles[log.level])}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
