import type { NodeProps } from '@xyflow/react'
import { ScanSearch } from 'lucide-react'
import type { HyperFlowNodeData, SonarMetrics } from '@/types/nodes'
import { NodeKinds, QualityGates } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber, cn } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { BaseNode, Meter, MetricRow } from './BaseNode'

export function SonarNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as SonarMetrics | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as SonarMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.Sonar, storeMetrics)
    : nodeData.health
  const failed = metrics.qualityGate === QualityGates.Failed

  return (
    <BaseNode
      id={id}
      title={nodeData.label}
      subtitle="Quality Gate"
      health={health}
      accentClass="bg-orange-400"
      icon={<ScanSearch className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Quality gate
        </span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
            failed ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300',
          )}
        >
          {metrics.qualityGate}
        </span>
      </div>
      <MetricRow
        label="Bugs"
        value={formatNumber(metrics.bugs)}
        tone={metrics.bugs >= 12 ? 'critical' : metrics.bugs >= 6 ? 'warning' : 'default'}
      />
      <Meter value={metrics.bugs} max={30} tone={failed ? 'rose' : 'orange'} />
      <MetricRow
        label="Vulnerabilidades"
        value={formatNumber(metrics.vulnerabilities)}
        tone={metrics.vulnerabilities >= 4 ? 'critical' : 'default'}
      />
    </BaseNode>
  )
}
