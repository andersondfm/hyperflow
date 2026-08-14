import { useCallback, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Pencil, RotateCcw, Skull, X, Zap } from 'lucide-react'
import type { ChaosFault, HealthLevel } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { cn, faultLabel } from '@/lib/utils'

interface BaseNodeProps {
  id: string
  title: string
  subtitle: string
  health: HealthLevel
  accentClass: string
  icon: ReactNode
  children: ReactNode
  footer?: ReactNode
  isLoadActive?: boolean
}

const healthStyles: Record<HealthLevel, string> = {
  healthy: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]',
  warning: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]',
  critical: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse',
}

const healthBorder: Record<HealthLevel, string> = {
  healthy: 'border-slate-700/80',
  warning: 'border-amber-500/50',
  critical: 'border-rose-500/60',
}

export function BaseNode({
  id,
  title,
  subtitle,
  health,
  accentClass,
  icon,
  children,
  footer,
  isLoadActive = false,
}: BaseNodeProps) {
  const { setNodes, deleteElements } = useReactFlow()
  const fault = useSimulationStore((s) => s.failedNodeIds[id])
  const isChaos = Boolean(fault)
  const visualHealth = isChaos ? 'critical' : health
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)

  const commitRename = useCallback(() => {
    const next = draft.trim()
    setEditing(false)
    if (!next || next === title) {
      setDraft(title)
      return
    }
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label: next } } : node,
      ),
    )
  }, [draft, id, setNodes, title])

  const onTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    }
    if (event.key === 'Escape') {
      setDraft(title)
      setEditing(false)
    }
  }

  const onDelete = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    void deleteElements({ nodes: [{ id }] })
  }

  return (
    <div
      className={cn(
        'group relative w-[240px] rounded-xl border bg-slate-900/95 shadow-xl backdrop-blur-sm transition-all duration-300',
        isChaos
          ? 'hf-node-chaos border-neutral-950 bg-black/92 ring-2 ring-rose-950/80'
          : healthBorder[visualHealth],
        isLoadActive && !isChaos && 'ring-1 ring-cyan-400/30',
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-slate-900 !bg-cyan-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-slate-900 !bg-cyan-400"
      />

      <button
        type="button"
        title="Remover nó"
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'nodrag nopan absolute -right-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full',
          'border border-slate-600 bg-slate-800 text-slate-300 shadow-lg',
          'hover:border-rose-400 hover:bg-rose-500 hover:text-white',
          'group-hover:flex',
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>

      <div className="flex items-start gap-3 border-b border-slate-800/80 px-3.5 py-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-950',
            isChaos ? 'bg-rose-700 text-white' : accentClass,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {editing ? (
              <input
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={onTitleKeyDown}
                onPointerDown={(e) => e.stopPropagation()}
                className="nodrag nopan w-full rounded border border-cyan-500/40 bg-slate-950 px-1.5 py-0.5 font-display text-sm font-semibold text-slate-100 outline-none"
              />
            ) : (
              <h3
                title="Clique duplo para renomear"
                onDoubleClick={() => {
                  setDraft(title)
                  setEditing(true)
                }}
                className="truncate font-display text-sm font-semibold tracking-tight text-slate-100"
              >
                {title}
              </h3>
            )}
            <div className="flex shrink-0 items-center gap-1">
              {!editing && (
                <button
                  type="button"
                  title="Renomear"
                  onClick={() => {
                    setDraft(title)
                    setEditing(true)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="nodrag nopan hidden rounded p-0.5 text-slate-500 hover:text-cyan-300 group-hover:block"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', healthStyles[visualHealth])}
                title={isChaos ? `Chaos: ${fault}` : `Saúde: ${visualHealth}`}
              />
            </div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {isChaos && fault ? `CHAOS · ${faultLabel(fault)}` : subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        {children}
        {footer}
      </div>
    </div>
  )
}

interface MetricRowProps {
  label: string
  value: string
  tone?: 'default' | 'warning' | 'critical' | 'success'
}

export function MetricRow({ label, value, tone = 'default' }: MetricRowProps) {
  const toneClass =
    tone === 'warning'
      ? 'text-amber-300'
      : tone === 'critical'
        ? 'text-rose-300'
        : tone === 'success'
          ? 'text-emerald-300'
          : 'text-slate-100'

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className={cn('font-mono text-xs font-medium tabular-nums', toneClass)}>
        {value}
      </span>
    </div>
  )
}

interface MeterProps {
  value: number
  max?: number
  tone?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'sky' | 'violet' | 'orange' | 'teal'
}

export function Meter({ value, max = 100, tone = 'cyan' }: MeterProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const bar =
    tone === 'amber'
      ? 'bg-amber-400'
      : tone === 'rose'
        ? 'bg-rose-400'
        : tone === 'emerald'
          ? 'bg-emerald-400'
          : tone === 'sky'
            ? 'bg-sky-400'
            : tone === 'violet'
              ? 'bg-violet-400'
              : tone === 'orange'
                ? 'bg-orange-400'
                : tone === 'teal'
                  ? 'bg-teal-400'
                  : 'bg-cyan-400'

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

interface ChaosActionsProps {
  nodeId: string
  fault: ChaosFault
  injectLabel: string
}

export function ChaosActions({ nodeId, fault, injectLabel }: ChaosActionsProps) {
  const active = useSimulationStore((s) => s.failedNodeIds[nodeId])
  const injectChaos = useSimulationStore((s) => s.injectChaos)
  const clearChaos = useSimulationStore((s) => s.clearChaos)

  return (
    <div className="nodrag nopan border-t border-slate-800/80 pt-2">
      {active ? (
        <button
          type="button"
          onClick={() => clearChaos(nodeId)}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/20"
        >
          <RotateCcw className="h-3 w-3" />
          Restaurar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => injectChaos(nodeId, fault)}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-rose-300 transition hover:bg-rose-500/20"
        >
          {fault === 'oom' ? <Zap className="h-3 w-3" /> : <Skull className="h-3 w-3" />}
          {injectLabel}
        </button>
      )}
    </div>
  )
}
