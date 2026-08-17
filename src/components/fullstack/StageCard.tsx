import type { ReactNode } from 'react'
import { StageStates, type StageState } from '@/store/deliveryStore'
import { cn } from '@/lib/utils'

interface StageCardProps {
  title: string
  subtitle: string
  icon: ReactNode
  state: StageState
  note?: string
  detail?: string
  /** Marca etapas que rodam fora do tempo da resposta HTTP. */
  badge?: string
  selected: boolean
  onSelect: () => void
}

const stateRing: Record<StageState, string> = {
  idle: 'border-slate-800 bg-slate-900/40',
  active: 'border-cyan-400/70 bg-cyan-500/10 shadow-[0_0_18px_rgba(34,211,238,0.28)]',
  done: 'border-emerald-500/45 bg-emerald-500/8',
  failed: 'border-rose-500/70 bg-rose-500/12 shadow-[0_0_18px_rgba(244,63,94,0.28)]',
  skipped: 'border-slate-800 border-dashed bg-slate-900/20 opacity-50',
}

const stateDot: Record<StageState, string> = {
  idle: 'bg-slate-600',
  active: 'bg-cyan-300 animate-pulse',
  done: 'bg-emerald-400',
  failed: 'bg-rose-400 animate-pulse',
  skipped: 'bg-slate-700',
}

const noteTone: Record<StageState, string> = {
  idle: 'text-slate-500',
  active: 'text-cyan-200',
  done: 'text-emerald-300',
  failed: 'text-rose-200',
  skipped: 'text-slate-600',
}

export function StageCard({
  title,
  subtitle,
  icon,
  state,
  note,
  detail,
  badge,
  selected,
  onSelect,
}: StageCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-[152px] shrink-0 rounded-lg border px-2.5 py-2 text-left transition-all duration-300',
        stateRing[state],
        selected && 'ring-1 ring-cyan-400/60',
        'hover:border-slate-600',
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
            state === StageStates.Idle || state === StageStates.Skipped
              ? 'bg-slate-800 text-slate-400'
              : state === StageStates.Failed
                ? 'bg-rose-500/25 text-rose-200'
                : state === StageStates.Active
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-emerald-400/90 text-slate-950',
          )}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded border border-violet-500/40 bg-violet-500/10 px-1 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-violet-300">
              {badge}
            </span>
          )}
          <span className={cn('mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full', stateDot[state])} />
        </div>
      </div>

      <p className="mt-1.5 truncate font-display text-[12px] font-semibold text-slate-100">
        {title}
      </p>
      <p className="truncate font-mono text-[9px] uppercase tracking-wider text-slate-500">
        {subtitle}
      </p>

      <div className="mt-1 flex items-center justify-between gap-1">
        <span className={cn('font-mono text-[9px] font-semibold uppercase', noteTone[state])}>
          {note ?? '\u00a0'}
        </span>
        <span className="font-mono text-[9px] tabular-nums text-slate-500">{detail ?? ''}</span>
      </div>
    </button>
  )
}

export function StageConnector({ lit }: { lit: boolean }) {
  return (
    <div className="flex shrink-0 items-center px-0.5" aria-hidden>
      <div
        className={cn(
          'h-px w-3 transition-colors duration-300',
          lit ? 'bg-cyan-400/70' : 'bg-slate-700',
        )}
      />
      <div
        className={cn(
          'h-1.5 w-1.5 rotate-45 border-r border-t transition-colors duration-300',
          lit ? 'border-cyan-400/70' : 'border-slate-700',
        )}
      />
    </div>
  )
}
