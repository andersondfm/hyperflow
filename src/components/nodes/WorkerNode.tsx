import type { NodeProps } from '@xyflow/react'
import { Cog } from 'lucide-react'
import type { HyperFlowNodeData, WorkerMetrics } from '@/types/nodes'
import { CircuitStates, NodeKinds } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber, cn } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { BaseNode, Meter, MetricRow } from './BaseNode'

const circuitLabel: Record<WorkerMetrics['circuitBreaker'], string> = {
  [CircuitStates.Closed]: 'Closed',
  [CircuitStates.Open]: 'OPEN',
  [CircuitStates.HalfOpen]: 'Half-Open',
}

export function WorkerNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as WorkerMetrics | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as WorkerMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.Worker, storeMetrics)
    : nodeData.health

  const circuitTone =
    metrics.circuitBreaker === CircuitStates.Open
      ? 'critical'
      : metrics.circuitBreaker === CircuitStates.HalfOpen
        ? 'warning'
        : 'success'

  return (
    <BaseNode
      title={nodeData.label}
      subtitle="Microservice Worker"
      health={health}
      accentClass="bg-emerald-400"
      icon={<Cog className={cn('h-4.5 w-4.5', metrics.active && 'animate-spin-slow')} strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Status
        </span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
            metrics.active
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-rose-500/15 text-rose-300',
          )}
        >
          {metrics.active ? 'Ativo' : 'Isolado'}
        </span>
      </div>
      <MetricRow
        label="Circuit Breaker"
        value={circuitLabel[metrics.circuitBreaker]}
        tone={circuitTone}
      />
      <MetricRow label="Processados/s" value={formatNumber(metrics.processedPerSecond)} />
      <Meter
        value={metrics.processedPerSecond}
        max={isLoadActive ? 800 : 150}
        tone={metrics.circuitBreaker === CircuitStates.Open ? 'rose' : 'emerald'}
      />
      <MetricRow
        label="Erros"
        value={formatNumber(metrics.errorCount)}
        tone={metrics.errorCount > 5 ? 'critical' : 'default'}
      />
    </BaseNode>
  )
}
