import {
  Check,
  ChevronsUp,
  DatabaseZap,
  Shield,
  Split,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { MitigationIds, type MitigationId } from '@/types/nodes'
import { MITIGATION_PLAYBOOK, countActiveMitigations } from '@/lib/mitigations'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

const ICONS: Record<MitigationId, LucideIcon> = {
  [MitigationIds.RateLimit]: Shield,
  [MitigationIds.Autoscale]: ChevronsUp,
  [MitigationIds.AggressiveCache]: DatabaseZap,
  [MitigationIds.ReadReplica]: Split,
}

export function MitigationPlaybook() {
  const isSpike = useSimulationStore((s) => s.isLoadTestActive)
  const active = useSimulationStore((s) => s.activeMitigations)
  const applyMitigation = useSimulationStore((s) => s.applyMitigation)
  const clearMitigations = useSimulationStore((s) => s.clearMitigations)
  const appliedCount = countActiveMitigations(active)

  return (
    <div
      className={cn(
        'rounded-lg border p-2.5 shadow-xl backdrop-blur-md transition-colors',
        isSpike
          ? 'border-amber-400/55 bg-slate-950/90 shadow-[0_0_28px_rgba(251,191,36,0.16)]'
          : 'border-slate-800 bg-slate-950/75',
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div>
          <p
            className={cn(
              'font-mono text-[10px] uppercase tracking-[0.18em]',
              isSpike ? 'text-amber-300/80' : 'text-slate-500',
            )}
          >
            Playbook do arquiteto
          </p>
          <h2 className="font-display text-sm font-semibold text-slate-100">Possíveis soluções</h2>
        </div>
        {appliedCount > 0 && (
          <button
            type="button"
            onClick={clearMitigations}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-900/80 px-1.5 py-1 text-[9px] font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            <Undo2 className="h-3 w-3" />
            Reverter mitigações
          </button>
        )}
      </div>

      <p className="mb-2 text-[10px] leading-snug text-slate-500">
        {isSpike
          ? 'O que você faria? Não é só subir máquina.'
          : 'Dispare o pico, depois aplique uma mitigação'}
      </p>

      <div className="space-y-1.5">
        {MITIGATION_PLAYBOOK.map((item) => {
          const applied = active[item.id]
          const Icon = ICONS[item.id]
          return (
            <button
              key={item.id}
              type="button"
              disabled={applied}
              onClick={() => applyMitigation(item.id)}
              className={cn(
                'flex w-full items-start gap-2 rounded-md border px-2 py-1.5 text-left transition',
                applied
                  ? 'cursor-default border-emerald-500/35 bg-emerald-500/10'
                  : isSpike
                    ? 'border-amber-500/25 bg-slate-900/70 hover:border-cyan-400/50 hover:bg-slate-900'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-3.5 w-3.5 shrink-0',
                  applied ? 'text-emerald-300' : isSpike ? 'text-amber-300' : 'text-slate-500',
                )}
                strokeWidth={2.25}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      applied ? 'text-emerald-200' : 'text-slate-100',
                    )}
                  >
                    {item.name}
                  </span>
                  {applied && (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                      aplicada
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-400">{item.effect}</p>
                <p className="mt-0.5 font-mono text-[9px] leading-snug text-slate-500">
                  {item.azure}
                  <span className="text-slate-600"> · </span>
                  {item.aws}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-2 font-mono text-[9px] leading-snug text-slate-600">
        Mesma ideia, nome diferente na nuvem.
      </p>
    </div>
  )
}
