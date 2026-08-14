import type { Edge, Node } from '@xyflow/react'
import type { HyperFlowNodeData } from '@/types/nodes'
import { HealthLevels, NodeKinds } from '@/types/nodes'
import { createBaselineMetrics } from '@/lib/simulationEngine'

const baseline = createBaselineMetrics()

export type HyperFlowNode = Node<HyperFlowNodeData, HyperFlowNodeData['kind']>

export const initialNodes: HyperFlowNode[] = [
  {
    id: 'gateway-1',
    type: NodeKinds.ApiGateway,
    position: { x: 40, y: 220 },
    data: {
      label: 'API Gateway',
      kind: NodeKinds.ApiGateway,
      health: HealthLevels.Healthy,
      metrics: baseline.gateway,
    },
  },
  {
    id: 'redis-1',
    type: NodeKinds.Redis,
    position: { x: 360, y: 40 },
    data: {
      label: 'Redis Cache',
      kind: NodeKinds.Redis,
      health: HealthLevels.Healthy,
      metrics: baseline.redis,
    },
  },
  {
    id: 'rabbitmq-1',
    type: NodeKinds.RabbitMQ,
    position: { x: 360, y: 220 },
    data: {
      label: 'RabbitMQ Orders',
      kind: NodeKinds.RabbitMQ,
      health: HealthLevels.Healthy,
      metrics: baseline.rabbitmq,
    },
  },
  {
    id: 'postgres-1',
    type: NodeKinds.Postgres,
    position: { x: 360, y: 420 },
    data: {
      label: 'PostgreSQL Primary',
      kind: NodeKinds.Postgres,
      health: HealthLevels.Healthy,
      metrics: baseline.postgres,
    },
  },
  {
    id: 'worker-orders',
    type: NodeKinds.Worker,
    position: { x: 700, y: 160 },
    data: {
      label: 'orders-worker',
      kind: NodeKinds.Worker,
      health: HealthLevels.Healthy,
      metrics: baseline.worker,
    },
  },
  {
    id: 'worker-notify',
    type: NodeKinds.Worker,
    position: { x: 700, y: 360 },
    data: {
      label: 'notify-worker',
      kind: NodeKinds.Worker,
      health: HealthLevels.Healthy,
      metrics: {
        ...baseline.worker,
        processedPerSecond: 60,
      },
    },
  },
  {
    id: 'dlq-1',
    type: NodeKinds.Dlq,
    position: { x: 980, y: 40 },
    data: {
      label: 'Dead Letter Queue',
      kind: NodeKinds.Dlq,
      health: HealthLevels.Healthy,
      metrics: baseline.dlq,
    },
  },
]

export const initialEdges: Edge[] = [
  {
    id: 'e-gw-redis',
    source: 'gateway-1',
    target: 'redis-1',
    type: 'animated',
    animated: false,
  },
  {
    id: 'e-gw-rmq',
    source: 'gateway-1',
    target: 'rabbitmq-1',
    type: 'animated',
    animated: false,
  },
  {
    id: 'e-gw-pg',
    source: 'gateway-1',
    target: 'postgres-1',
    type: 'animated',
    animated: false,
  },
  {
    id: 'e-rmq-orders',
    source: 'rabbitmq-1',
    target: 'worker-orders',
    type: 'animated',
    animated: false,
  },
  {
    id: 'e-rmq-notify',
    source: 'rabbitmq-1',
    target: 'worker-notify',
    type: 'animated',
    animated: false,
  },
  {
    id: 'e-orders-pg',
    source: 'worker-orders',
    target: 'postgres-1',
    type: 'animated',
    animated: false,
  },
  {
    id: 'e-rmq-dlq',
    source: 'rabbitmq-1',
    target: 'dlq-1',
    type: 'dashed-fault',
    animated: false,
  },
]
