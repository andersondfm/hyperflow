import type { NodeProps } from '@xyflow/react'
import { Cylinder } from 'lucide-react'
import type { HyperFlowNodeData, PostgresMetrics } from '@/types/nodes'
import { ChaosFaults, NodeKinds } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber, formatPercent } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { BaseNode, ChaosActions, Meter, MetricRow } from './BaseNode'

export function PostgresNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as
    | PostgresMetrics
    | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as PostgresMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.Postgres, storeMetrics)
    : nodeData.health

  return (
    <BaseNode
      id={id}
      title={nodeData.label}
      subtitle="Relational Store"
      health={health}
      accentClass="bg-sky-400"
      icon={<Cylinder className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
      footer={<ChaosActions nodeId={id} fault={ChaosFaults.Down} injectLabel="Simular falha" />}
    >
      <MetricRow
        label="Latência"
        value={`${formatNumber(metrics.latencyMs, 1)} ms`}
        tone={
          metrics.latencyMs >= 120
            ? 'critical'
            : metrics.latencyMs >= 40
              ? 'warning'
              : 'success'
        }
      />
      <Meter
        value={metrics.latencyMs}
        max={200}
        tone={metrics.latencyMs >= 80 ? 'rose' : metrics.latencyMs >= 40 ? 'amber' : 'sky'}
      />
      <MetricRow label="Queries ativas" value={formatNumber(metrics.activeQueries)} />
      <MetricRow label="Conexões" value={formatNumber(metrics.connections)} />
      <MetricRow label="Cache hit" value={formatPercent(metrics.cacheHitRatio)} />
    </BaseNode>
  )
}
