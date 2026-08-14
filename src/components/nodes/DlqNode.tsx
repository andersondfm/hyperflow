import type { NodeProps } from '@xyflow/react'
import { MailWarning, RotateCcw } from 'lucide-react'
import type { DlqMetrics, HyperFlowNodeData } from '@/types/nodes'
import { NodeKinds } from '@/types/nodes'
import { useSimulationStore } from '@/store/simulationStore'
import { formatNumber } from '@/lib/utils'
import { computeHealth } from '@/lib/simulationEngine'
import { BaseNode, Meter, MetricRow } from './BaseNode'

export function DlqNode({ id, data }: NodeProps) {
  const nodeData = data as HyperFlowNodeData
  const storeMetrics = useSimulationStore((s) => s.nodeMetrics[id]) as DlqMetrics | undefined
  const deadLetters = useSimulationStore((s) => s.deadLetters)
  const requeueDlq = useSimulationStore((s) => s.requeueDlq)
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const metrics = (storeMetrics ?? nodeData.metrics) as DlqMetrics
  const count = storeMetrics ? deadLetters : metrics.deadLetters
  const health = storeMetrics
    ? computeHealth(NodeKinds.Dlq, { ...metrics, deadLetters: count })
    : nodeData.health

  return (
    <BaseNode
      id={id}
      title={nodeData.label}
      subtitle="Dead Letter Queue"
      health={health}
      accentClass="bg-red-400"
      icon={<MailWarning className="h-4.5 w-4.5" strokeWidth={2.25} />}
      isLoadActive={isLoadActive}
      footer={
        <div className="nodrag nopan border-t border-slate-800/80 pt-2">
          <button
            type="button"
            onClick={() => requeueDlq()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <RotateCcw className="h-3 w-3" />
            Reprocessar (Requeue)
          </button>
        </div>
      }
    >
      <MetricRow
        label="Mensagens mortas"
        value={formatNumber(count)}
        tone={count >= 800 ? 'critical' : count >= 80 ? 'warning' : 'default'}
      />
      <Meter value={count} max={2_000} tone={count >= 80 ? 'rose' : 'cyan'} />
      <MetricRow label="Motivo" value={metrics.lastReason} />
    </BaseNode>
  )
}
