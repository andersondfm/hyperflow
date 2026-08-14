import type { NodeProps } from '@xyflow/react'
import { FlaskConical } from 'lucide-react'
import type { HyperFlowNodeData, IntegrationTestMetrics } from '@/types/nodes'
import { NodeKinds, TestRunStatuses } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatPercent, cn } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { BaseNode, Meter, MetricRow } from './BaseNode'

const statusLabel: Record<IntegrationTestMetrics['lastRunStatus'], string> = {
  [TestRunStatuses.Pass]: 'PASS',
  [TestRunStatuses.Fail]: 'FAIL',
  [TestRunStatuses.Running]: 'RUNNING',
}

export function IntegrationTestNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as
    | IntegrationTestMetrics
    | undefined
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as IntegrationTestMetrics
  const health = storeMetrics
    ? computeHealth(NodeKinds.IntegrationTest, storeMetrics)
    : nodeData.health

  return (
    <BaseNode
      id={id}
      title={nodeData.label}
      subtitle="CI · Quality"
      health={health}
      accentClass="bg-violet-400"
      icon={<FlaskConical className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
          Última execução
        </span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
            metrics.lastRunStatus === TestRunStatuses.Pass && 'bg-emerald-500/15 text-emerald-300',
            metrics.lastRunStatus === TestRunStatuses.Fail && 'bg-rose-500/15 text-rose-300',
            metrics.lastRunStatus === TestRunStatuses.Running && 'bg-amber-500/15 text-amber-300',
          )}
        >
          {statusLabel[metrics.lastRunStatus]}
        </span>
      </div>
      <MetricRow
        label="Cobertura"
        value={formatPercent(metrics.coveragePercent)}
        tone={metrics.coveragePercent < 60 ? 'critical' : metrics.coveragePercent < 75 ? 'warning' : 'success'}
      />
      <Meter
        value={metrics.coveragePercent}
        tone={metrics.coveragePercent < 60 ? 'rose' : 'violet'}
      />
    </BaseNode>
  )
}
