/** Tipos de infraestrutura suportados pelo HyperFlow */
export const NodeKinds = {
  ApiGateway: 'apiGateway',
  Redis: 'redis',
  RabbitMQ: 'rabbitmq',
  Postgres: 'postgres',
  Worker: 'worker',
  Container: 'container',
  IntegrationTest: 'integrationTest',
  Sonar: 'sonar',
  Dlq: 'dlq',
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

export const ChaosFaults = {
  Down: 'down',
  Oom: 'oom',
  Timeout: 'timeout',
} as const

export type ChaosFault = (typeof ChaosFaults)[keyof typeof ChaosFaults]

export const TestRunStatuses = {
  Pass: 'pass',
  Fail: 'fail',
  Running: 'running',
} as const

export type TestRunStatus = (typeof TestRunStatuses)[keyof typeof TestRunStatuses]

export const QualityGates = {
  Ok: 'OK',
  Failed: 'FAILED',
} as const

export type QualityGate = (typeof QualityGates)[keyof typeof QualityGates]

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

export interface ContainerMetrics {
  replicas: number
  cpuPercent: number
  processedPerSecond: number
}

export interface IntegrationTestMetrics {
  lastRunStatus: TestRunStatus
  coveragePercent: number
}

export interface SonarMetrics {
  bugs: number
  vulnerabilities: number
  qualityGate: QualityGate
}

export interface DlqMetrics {
  deadLetters: number
  lastReason: string
}

export type NodeMetricsMap = {
  [NodeKinds.ApiGateway]: ApiGatewayMetrics
  [NodeKinds.Redis]: RedisMetrics
  [NodeKinds.RabbitMQ]: RabbitMQMetrics
  [NodeKinds.Postgres]: PostgresMetrics
  [NodeKinds.Worker]: WorkerMetrics
  [NodeKinds.Container]: ContainerMetrics
  [NodeKinds.IntegrationTest]: IntegrationTestMetrics
  [NodeKinds.Sonar]: SonarMetrics
  [NodeKinds.Dlq]: DlqMetrics
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
  costPerHour: number
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
  estimatedCostPerHour: number
  deadLetters: number
  throughputHistory: ThroughputSample[]
  logs: SimulationLog[]
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
  nodeKinds: Record<string, NodeKind>
  failedNodeIds: Record<string, ChaosFault>
}
