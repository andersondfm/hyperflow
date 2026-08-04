import { useCallback, useMemo, useRef, type DragEvent } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from '@/components/nodes'
import { edgeTypes } from '@/components/canvas/AnimatedEdge'
import { initialEdges, initialNodes, type HyperFlowNode } from '@/data/initialFlow'
import { NodeKinds, HealthLevels, type NodeKind, type HyperFlowNodeData } from '@/types/nodes'
import { createBaselineMetrics } from '@/lib/simulationEngine'
import { createId, kindLabel } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

function defaultMetricsFor(kind: NodeKind): HyperFlowNodeData['metrics'] {
  const baseline = createBaselineMetrics()
  switch (kind) {
    case NodeKinds.ApiGateway:
      return baseline.gateway
    case NodeKinds.Redis:
      return baseline.redis
    case NodeKinds.RabbitMQ:
      return baseline.rabbitmq
    case NodeKinds.Postgres:
      return baseline.postgres
    case NodeKinds.Worker:
      return baseline.worker
  }
}

export function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const pushLog = useSimulationStore((s) => s.pushLog)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'animated',
            id: createId('edge'),
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const kind = event.dataTransfer.getData('application/hyperflow-node') as NodeKind
      if (!kind || !Object.values(NodeKinds).includes(kind)) return

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = {
        x: event.clientX - bounds.left - 120,
        y: event.clientY - bounds.top - 40,
      }

      const id = createId(kind)
      const newNode: HyperFlowNode = {
        id,
        type: kind,
        position,
        data: {
          label: kindLabel(kind),
          kind,
          health: HealthLevels.Healthy,
          metrics: defaultMetricsFor(kind),
        },
      }

      setNodes((nds) => [...nds, newNode as Node])
      pushLog({
        level: 'info',
        source: 'canvas',
        message: `Nó ${kindLabel(kind)} adicionado à topologia (${id})`,
      })
    },
    [setNodes, pushLog],
  )

  const proOptions = useMemo(() => ({ hideAttribution: true }), [])

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={1.75}
        proOptions={proOptions}
        className={isLoadActive ? 'hf-canvas-load' : undefined}
      >
        <Background
          id="grid"
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="#1e293b"
        />
        <Controls
          className="!overflow-hidden !rounded-lg !border !border-slate-700 !bg-slate-900/90 !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!overflow-hidden !rounded-lg !border !border-slate-700 !bg-slate-950/90"
          nodeColor={(node) => {
            switch (node.type) {
              case NodeKinds.ApiGateway:
                return '#22d3ee'
              case NodeKinds.Redis:
                return '#fb7185'
              case NodeKinds.RabbitMQ:
                return '#fbbf24'
              case NodeKinds.Postgres:
                return '#38bdf8'
              case NodeKinds.Worker:
                return '#34d399'
              default:
                return '#64748b'
            }
          }}
          maskColor="rgba(2, 6, 23, 0.7)"
        />
      </ReactFlow>

      {isLoadActive && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-200">
              Pico de carga em andamento
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
