import { useMemo } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber } from '@/lib/utils'
import { NodeKinds } from '@/types/nodes'
import { findMetricsByKind, hottestRabbitMetrics } from '@/lib/simulationEngine'
import { countActiveMitigations } from '@/lib/mitigations'

export function ThroughputChart() {
  const history = useSimulationStore((s) => s.throughputHistory)
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const recovering = useSimulationStore((s) => countActiveMitigations(s.activeMitigations) > 0)
  const hot = isLoadActive && !recovering

  const { path, maxRps } = useMemo(() => {
    if (history.length < 2) {
      return { path: '', maxRps: 100 }
    }
    const max = Math.max(...history.map((s) => s.rps), 100)
    const w = 280
    const h = 64
    const points = history.map((sample, i) => {
      const x = (i / (history.length - 1)) * w
      const y = h - (sample.rps / max) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return { path: `M ${points.join(' L ')}`, maxRps: max }
  }, [history])

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Vazão (RPS)
        </p>
        <p className="font-mono text-[10px] text-slate-600">
          max {formatNumber(maxRps)}
        </p>
      </div>
      <svg viewBox="0 0 280 64" className="h-16 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rpsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hot ? '#fbbf24' : '#22d3ee'} stopOpacity="0.35" />
            <stop offset="100%" stopColor={hot ? '#fbbf24' : '#22d3ee'} stopOpacity="0" />
          </linearGradient>
        </defs>
        {path && (
          <>
            <path
              d={`${path} L 280,64 L 0,64 Z`}
              fill="url(#rpsFill)"
            />
            <path
              d={path}
              fill="none"
              stroke={hot ? '#fbbf24' : '#22d3ee'}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}
        {!path && (
          <text x="140" y="36" textAnchor="middle" className="fill-slate-600 font-mono text-[10px]">
            Aguardando amostras…
          </text>
        )}
      </svg>
    </div>
  )
}

export function MetricCards() {
  const nodeMetrics = useSimulationStore((s) => s.nodeMetrics)
  const nodeKinds = useSimulationStore((s) => s.nodeKinds)
  const deadLetters = useSimulationStore((s) => s.deadLetters)
  const redis = findMetricsByKind(nodeMetrics, nodeKinds, NodeKinds.Redis)
  const rabbit = hottestRabbitMetrics(nodeMetrics, nodeKinds)
  const postgres = findMetricsByKind(nodeMetrics, nodeKinds, NodeKinds.Postgres)

  const cards = [
    {
      label: 'Redis Hit',
      value: redis ? `${redis.hitRate.toFixed(1)}%` : '—',
      hint: 'cache efficiency',
      alert: (redis?.hitRate ?? 100) < 55,
    },
    {
      label: 'Queue Depth',
      value: rabbit ? formatNumber(rabbit.queueDepth) : '—',
      hint: rabbit?.overflow
        ? rabbit.consumeRate > rabbit.publishRate
          ? 'DRENANDO'
          : 'OVERFLOW'
        : 'mensagens',
      alert: rabbit?.overflow === true && rabbit.consumeRate <= rabbit.publishRate,
    },
    {
      label: 'PG Latency',
      value: postgres ? `${postgres.latencyMs.toFixed(0)} ms` : '—',
      hint: 'p50 aproximado',
      alert: (postgres?.latencyMs ?? 0) > 80,
    },
    {
      label: 'Mensagens mortas',
      value: formatNumber(deadLetters),
      hint: 'DLQ',
      alert: deadLetters >= 80,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border px-2.5 py-2 ${
            card.alert
              ? 'border-rose-500/40 bg-rose-500/10'
              : 'border-slate-800 bg-slate-900/50'
          }`}
        >
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
            {card.label}
          </p>
          <p
            className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${
              card.alert ? 'text-rose-300' : 'text-slate-100'
            }`}
          >
            {card.value}
          </p>
          <p className="font-mono text-[9px] text-slate-600">{card.hint}</p>
        </div>
      ))}
    </div>
  )
}
