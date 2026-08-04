import type { NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'
import type { HyperFlowNodeData, RabbitMQMetrics } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { NodeKinds } from '@/types/nodes'
import { cn } from '@/lib/utils'
import { BaseNode, Meter, MetricRow } from './BaseNode'

export function RabbitMQNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as
    | RabbitMQMetrics
    | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as RabbitMQMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.RabbitMQ, storeMetrics)
    : nodeData.health

  const queueTone =
    metrics.overflow || metrics.queueDepth >= 5_000
      ? 'rose'
      : metrics.queueDepth >= 1_500
        ? 'amber'
        : 'cyan'

  return (
    <BaseNode
      title={nodeData.label}
      subtitle="Message Broker"
      health={health}
      accentClass="bg-amber-400"
      icon={<Layers className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      {metrics.overflow && (
        <div
          className={cn(
            'rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1.5',
            'animate-pulse font-mono text-[10px] font-semibold uppercase tracking-wide text-rose-300',
          )}
        >
          ⚠ Overflow — fila estourada
        </div>
      )}
      <MetricRow
        label="Fila"
        value={formatNumber(metrics.queueDepth)}
        tone={
          metrics.overflow
            ? 'critical'
            : metrics.queueDepth >= 1_500
              ? 'warning'
              : 'default'
        }
      />
      <Meter value={metrics.queueDepth} max={5_000} tone={queueTone} />
      <MetricRow label="Publish/s" value={formatNumber(metrics.publishRate)} />
      <MetricRow label="Consume/s" value={formatNumber(metrics.consumeRate)} />
    </BaseNode>
  )
}
