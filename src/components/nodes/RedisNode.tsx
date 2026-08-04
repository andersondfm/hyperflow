import type { NodeProps } from '@xyflow/react'
import { DatabaseZap } from 'lucide-react'
import type { HyperFlowNodeData, RedisMetrics } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber, formatPercent } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { NodeKinds } from '@/types/nodes'
import { BaseNode, Meter, MetricRow } from './BaseNode'

export function RedisNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as RedisMetrics | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as RedisMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.Redis, storeMetrics)
    : nodeData.health

  return (
    <BaseNode
      title={nodeData.label}
      subtitle="In-Memory Cache"
      health={health}
      accentClass="bg-rose-400"
      icon={<DatabaseZap className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      <MetricRow
        label="Hit rate"
        value={formatPercent(metrics.hitRate)}
        tone={metrics.hitRate < 70 ? 'critical' : metrics.hitRate < 85 ? 'warning' : 'success'}
      />
      <Meter value={metrics.hitRate} tone={metrics.hitRate < 75 ? 'rose' : 'emerald'} />
      <MetricRow label="Miss rate" value={formatPercent(metrics.missRate)} />
      <MetricRow
        label="Memória"
        value={`${formatNumber(metrics.memoryUsageMb)} MB`}
      />
      <MetricRow label="Keys" value={formatNumber(metrics.keys)} />
    </BaseNode>
  )
}
