import type { NodeProps } from '@xyflow/react'
import { Network } from 'lucide-react'
import type { ApiGatewayMetrics, HyperFlowNodeData } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber } from '@/lib/utils'
import { BaseNode, Meter, MetricRow } from './BaseNode'

export function ApiGatewayNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as
    | ApiGatewayMetrics
    | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as ApiGatewayMetrics
  const health = useSimulationStore((s) => {
    const m = s.nodeMetrics[id] as ApiGatewayMetrics | undefined
    if (!m) return nodeData.health
    if (m.errorRate >= 8) return 'critical' as const
    if (m.errorRate >= 2 || s.isLoadTestActive) return 'warning' as const
    return 'healthy' as const
  })

  return (
    <BaseNode
      title={nodeData.label}
      subtitle="Load Balancer · Ingress"
      health={health}
      accentClass="bg-cyan-400"
      icon={<Network className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      <MetricRow
        label="RPS"
        value={formatNumber(metrics.requestsPerSecond)}
        tone={isLoadActive ? 'warning' : 'default'}
      />
      <Meter
        value={metrics.requestsPerSecond}
        max={isLoadActive ? 12_000 : 400}
        tone={isLoadActive ? 'amber' : 'cyan'}
      />
      <MetricRow label="Conexões" value={formatNumber(metrics.activeConnections)} />
      <MetricRow
        label="Error rate"
        value={`${formatNumber(metrics.errorRate, 1)}%`}
        tone={metrics.errorRate >= 5 ? 'critical' : metrics.errorRate >= 2 ? 'warning' : 'success'}
      />
    </BaseNode>
  )
}
