import { useMemo } from 'react'
import { Cloud } from 'lucide-react'
import { useSimulationStore } from '@/store/simulationStore'
import { cn, costTone, formatBRL } from '@/lib/utils'

interface FinOpsCardProps {
  variant: 'full' | 'compact' | 'floating'
}

export function FinOpsCard({ variant }: FinOpsCardProps) {
  const cost = useSimulationStore((s) => s.estimatedCostPerHour)
  const isSpike = useSimulationStore((s) => s.isLoadTestActive)
  const history = useSimulationStore((s) => s.throughputHistory)
  const tone = costTone(cost, isSpike)

  const toneText =
    tone === 'rose' ? 'text-rose-300' : tone === 'amber' ? 'text-amber-300' : 'text-cyan-300'
  const toneBorder =
    tone === 'rose'
      ? 'border-rose-500/40 bg-rose-500/10'
      : tone === 'amber'
        ? 'border-amber-500/40 bg-amber-500/10'
        : 'border-cyan-500/30 bg-slate-900/70'
  const stroke = tone === 'rose' ? '#fb7185' : tone === 'amber' ? '#fbbf24' : '#22d3ee'

  const path = useMemo(() => {
    const points = history.map((s) => s.costPerHour)
    if (points.length < 2) return ''
    const max = Math.max(...points, 12.5)
    const min = Math.min(...points, 8)
    const span = Math.max(max - min, 4)
    const w = 220
    const h = 36
    const coords = points.map((value, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((value - min) / span) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return `M ${coords.join(' L ')}`
  }, [history])

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5', toneBorder)}>
        <Cloud className={cn('h-3.5 w-3.5', toneText)} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">GCP</span>
        <span className={cn('font-mono text-sm font-semibold tabular-nums', toneText)}>
          {formatBRL(cost)}/h
        </span>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border p-3 shadow-xl backdrop-blur-md', toneBorder)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          Custo Estimado de Nuvem (GCP/Hora)
        </p>
        {tone === 'rose' && (
          <span className="font-mono text-[9px] font-semibold uppercase text-rose-300">
            fora de controle
          </span>
        )}
      </div>
      <p className={cn('font-display text-2xl font-bold tabular-nums tracking-tight', toneText)}>
        {formatBRL(cost)}
        <span className="ml-1 font-mono text-xs font-medium text-slate-500">/hora</span>
      </p>
      {variant === 'full' && (
        <p className="mt-0.5 font-mono text-[10px] text-slate-600">
          Cache Redis reduz hits no Postgres
        </p>
      )}
      <svg viewBox="0 0 220 36" className="mt-2 h-9 w-full" preserveAspectRatio="none">
        {path ? (
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : (
          <text x="110" y="22" textAnchor="middle" className="fill-slate-600 font-mono text-[9px]">
            Aguardando…
          </text>
        )}
      </svg>
    </div>
  )
}
