/** Tipos de infraestrutura suportados pelo HyperFlow */
export const NodeKinds = {
  ApiGateway: 'apiGateway',
  Redis: 'redis',
  RabbitMQ: 'rabbitmq',
  Postgres: 'postgres',
  Worker: 'worker',
} as const

export type NodeKind = (typeof NodeKinds)[keyof typeof NodeKinds]

export const HealthLevels = {
  Healthy: 'healthy',
  Warning: 'warning',
  Critical: 'critical',
} as const

export type HealthLevel = (typeof HealthLevels)[keyof typeof HealthLevels]

export const CircuitStates = {
  Closed: 'closed',
  Open: 'open',
  HalfOpen: 'half-open',
} as const

export type CircuitState = (typeof CircuitStates)[keyof typeof CircuitStates]

export interface ApiGatewayMetrics {
  requestsPerSecond: number
  activeConnections: number
  errorRate: number
}

export interface RedisMetrics {
  hitRate: number
  missRate: number
  memoryUsageMb: number
  keys: number
}

export interface RabbitMQMetrics {
  queueDepth: number
  publishRate: number
  consumeRate: number
  overflow: boolean
}

export interface PostgresMetrics {
  latencyMs: number
  activeQueries: number
  connections: number
  cacheHitRatio: number
}

export interface WorkerMetrics {
  active: boolean
  circuitBreaker: CircuitState
  processedPerSecond: number
  errorCount: number
}

export type NodeMetricsMap = {
  [NodeKinds.ApiGateway]: ApiGatewayMetrics
  [NodeKinds.Redis]: RedisMetrics
  [NodeKinds.RabbitMQ]: RabbitMQMetrics
  [NodeKinds.Postgres]: PostgresMetrics
  [NodeKinds.Worker]: WorkerMetrics
}

export interface HyperFlowNodeData extends Record<string, unknown> {
  label: string
  kind: NodeKind
  health: HealthLevel
  metrics: NodeMetricsMap[NodeKind]
}

export interface PaletteItem {
  kind: NodeKind
  label: string
  description: string
  accent: string
}

export interface ThroughputSample {
  timestamp: number
  rps: number
  queueDepth: number
  latencyMs: number
}

export interface SimulationLog {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'success'
  source: string
  message: string
}

export interface SimulationSnapshot {
  isLoadTestActive: boolean
  loadMultiplier: number
  totalRps: number
  throughputHistory: ThroughputSample[]
  logs: SimulationLog[]
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
}
