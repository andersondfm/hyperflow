import type { ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { HealthLevel } from '@/types/nodes'
import { cn } from '@/lib/utils'

interface BaseNodeProps {
  title: string
  subtitle: string
  health: HealthLevel
  accentClass: string
  icon: ReactNode
  children: ReactNode
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
  title,
  subtitle,
  health,
  accentClass,
  icon,
  children,
  isLoadActive = false,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        'group relative w-[240px] rounded-xl border bg-slate-900/95 shadow-xl backdrop-blur-sm transition-all duration-300',
        healthBorder[health],
        isLoadActive && 'ring-1 ring-cyan-400/30',
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

      <div className="flex items-start gap-3 border-b border-slate-800/80 px-3.5 py-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-950',
            accentClass,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-display text-sm font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', healthStyles[health])}
              title={`Saúde: ${health}`}
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">{children}</div>
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
  tone?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'sky'
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
