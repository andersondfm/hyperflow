import { Activity, RotateCcw, Zap } from 'lucide-react'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber, cn } from '@/lib/utils'

export function Header() {
  const isLoadTestActive = useSimulationStore((s) => s.isLoadTestActive)
  const totalRps = useSimulationStore((s) => s.totalRps)
  const triggerLoadSpike = useSimulationStore((s) => s.triggerLoadSpike)
  const stopLoadSpike = useSimulationStore((s) => s.stopLoadSpike)
  const resetSimulation = useSimulationStore((s) => s.resetSimulation)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
          <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-display text-base font-bold tracking-tight text-slate-50">
            HyperFlow
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Distributed Systems Simulator
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 sm:flex">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Throughput
          </span>
          <span
            className={cn(
              'font-mono text-sm font-semibold tabular-nums',
              isLoadTestActive ? 'text-amber-300' : 'text-cyan-300',
            )}
          >
            {formatNumber(totalRps)} RPS
          </span>
        </div>

        <button
          type="button"
          onClick={resetSimulation}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        {isLoadTestActive ? (
          <button
            type="button"
            onClick={stopLoadSpike}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
          >
            Parar pico
          </button>
        ) : (
          <button
            type="button"
            onClick={triggerLoadSpike}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Zap className="h-3.5 w-3.5" />
            Disparar Pico de 10k req/min
          </button>
        )}
      </div>
    </header>
  )
}
