import { useCallback, useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronsRight,
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

const PLAYBOOK_VISIBLE_KEY = 'hyperflow.playbook.visible'

function readPlaybookVisible(): boolean {
  try {
    const raw = window.localStorage.getItem(PLAYBOOK_VISIBLE_KEY)
    if (raw === null) return true
    return raw === '1' || raw === 'true'
  } catch {
    return true
  }
}

function writePlaybookVisible(visible: boolean): void {
  try {
    window.localStorage.setItem(PLAYBOOK_VISIBLE_KEY, visible ? '1' : '0')
  } catch {
    // quota / private mode — preference stays in memory for this session
  }
}

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
  const [visible, setVisible] = useState(readPlaybookVisible)

  const setPlaybookVisible = useCallback((next: boolean) => {
    setVisible(next)
    writePlaybookVisible(next)
  }, [])

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setPlaybookVisible(true)}
        title="Mostrar playbook"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 shadow-xl backdrop-blur-md transition',
          isSpike
            ? 'border-amber-400/50 bg-slate-950/85 text-amber-100 hover:border-amber-300/70'
            : 'border-slate-700 bg-slate-950/80 text-slate-200 hover:border-slate-500 hover:text-slate-50',
        )}
      >
        <BookOpen className={cn('h-3.5 w-3.5', isSpike ? 'text-amber-300' : 'text-cyan-300')} />
        <span className="text-[11px] font-semibold">Playbook</span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        'w-72 rounded-lg border p-2.5 shadow-xl backdrop-blur-md transition-colors',
        isSpike
          ? 'border-amber-400/55 bg-slate-950/90 shadow-[0_0_28px_rgba(251,191,36,0.16)]'
          : 'border-slate-800 bg-slate-950/75',
      )}
    >
      <div className="mb-1.5">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'font-mono text-[10px] uppercase tracking-[0.18em]',
              isSpike ? 'text-amber-300/80' : 'text-slate-500',
            )}
          >
            Playbook do arquiteto
          </p>
          <button
            type="button"
            onClick={() => setPlaybookVisible(false)}
            title="Ocultar"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-slate-700 bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            Ocultar
            <ChevronsRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-100">Possíveis soluções</h2>
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
