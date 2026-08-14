import { useCallback, useMemo, useRef, type DragEvent } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from '@/components/nodes'
import { edgeTypes } from '@/components/canvas/AnimatedEdge'
import { FinOpsCard } from '@/components/telemetry/FinOpsCard'
import { initialEdges, initialNodes, type HyperFlowNode } from '@/data/initialFlow'
import { NodeKinds, HealthLevels, type HyperFlowNodeData } from '@/types/nodes'
import { createMetricsForKind } from '@/lib/simulationEngine'
import { createId, isNodeKind, kindLabel } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

function minimapColor(type: string | undefined): string {
  switch (type) {
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
    case NodeKinds.Container:
      return '#2dd4bf'
    case NodeKinds.IntegrationTest:
      return '#a78bfa'
    case NodeKinds.Sonar:
      return '#fb923c'
    case NodeKinds.Dlq:
      return '#f87171'
    default:
      return '#64748b'
  }
}

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { screenToFlowPosition } = useReactFlow()
  const isLoadActive = useSimulationStore((s) => s.isLoadTestActive)
  const chaosCount = useSimulationStore((s) => Object.keys(s.failedNodeIds).length)
  const pushLog = useSimulationStore((s) => s.pushLog)
  const registerNode = useSimulationStore((s) => s.registerNode)
  const unregisterNode = useSimulationStore((s) => s.unregisterNode)

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
      const raw = event.dataTransfer.getData('application/hyperflow-node')
      if (!isNodeKind(raw)) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      position.x -= 120
      position.y -= 40

      const id = createId(raw)
      const newNode: HyperFlowNode = {
        id,
        type: raw,
        position,
        data: {
          label: kindLabel(raw),
          kind: raw,
          health: HealthLevels.Healthy,
          metrics: createMetricsForKind(raw),
        },
      }

      registerNode(id, raw)
      setNodes((nds) => [...nds, newNode as Node])
      pushLog({
        level: 'info',
        source: 'canvas',
        message: `Nó ${kindLabel(raw)} adicionado à topologia (${id})`,
      })
    },
    [setNodes, pushLog, registerNode, screenToFlowPosition],
  )

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      for (const node of deleted) {
        const data = node.data as HyperFlowNodeData | undefined
        const label = data?.label ?? node.id
        unregisterNode(node.id)
        pushLog({
          level: 'warn',
          source: 'canvas',
          message: `Nó ${label} removido da topologia`,
        })
      }
    },
    [unregisterNode, pushLog],
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
        onNodesDelete={onNodesDelete}
        deleteKeyCode={['Backspace', 'Delete']}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
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
          nodeColor={(node) => minimapColor(node.type)}
          maskColor="rgba(2, 6, 23, 0.7)"
        />
      </ReactFlow>

      <div className="pointer-events-none absolute left-4 top-4 z-10 w-64">
        <div className="pointer-events-auto">
          <FinOpsCard variant="floating" />
        </div>
      </div>

      {(isLoadActive || chaosCount > 0) && (
        <div className="pointer-events-none absolute left-72 top-4 z-10">
          <div className="flex items-center gap-2">
            {isLoadActive && (
              <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-200">
                  Pico de carga em andamento
                </span>
              </div>
            )}
            {chaosCount > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/15 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-rose-200">
                  Chaos ativo · {chaosCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
