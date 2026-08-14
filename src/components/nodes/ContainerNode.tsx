import type { NodeProps } from '@xyflow/react'
import { Box } from 'lucide-react'
import type { ContainerMetrics, HyperFlowNodeData } from '@/types/nodes'
import { NodeKinds } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber, formatPercent } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { BaseNode, Meter, MetricRow } from './BaseNode'

export function ContainerNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as
    | ContainerMetrics
    | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as ContainerMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.Container, storeMetrics)
    : nodeData.health

  return (
    <BaseNode
      id={id}
      title={nodeData.label}
      subtitle="K8s Replica"
      health={health}
      accentClass="bg-teal-400"
      icon={<Box className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      <MetricRow label="Réplicas" value={formatNumber(metrics.replicas)} tone="success" />
      <MetricRow
        label="CPU"
        value={formatPercent(metrics.cpuPercent)}
        tone={metrics.cpuPercent >= 88 ? 'critical' : metrics.cpuPercent >= 70 ? 'warning' : 'default'}
      />
      <Meter
        value={metrics.cpuPercent}
        tone={metrics.cpuPercent >= 88 ? 'rose' : metrics.cpuPercent >= 70 ? 'amber' : 'teal'}
      />
      <MetricRow
        label="Processados/s"
        value={formatNumber(metrics.processedPerSecond)}
        tone={isLoadActive ? 'warning' : 'default'}
      />
    </BaseNode>
  )
}
