import type {
  ApiGatewayMetrics,
  HealthLevel,
  NodeKind,
  NodeMetricsMap,
  PostgresMetrics,
  RabbitMQMetrics,
  RedisMetrics,
  SimulationLog,
  ThroughputSample,
  WorkerMetrics,
} from '@/types/nodes'
import { CircuitStates, HealthLevels, NodeKinds } from '@/types/nodes'
import { clamp, createId, healthFromThreshold } from '@/lib/utils'

const BASELINE = {
  gatewayRps: 120,
  redisHitRate: 92,
  queueDepth: 40,
  postgresLatency: 8,
  workerRps: 95,
} as const

const MAX_HISTORY = 40
const MAX_LOGS = 80
const QUEUE_OVERFLOW_THRESHOLD = 5_000

export interface BaselineMetrics {
  gateway: ApiGatewayMetrics
  redis: RedisMetrics
  rabbitmq: RabbitMQMetrics
  postgres: PostgresMetrics
  worker: WorkerMetrics
}

export function createBaselineMetrics(): BaselineMetrics {
  return {
    gateway: {
      requestsPerSecond: BASELINE.gatewayRps,
      activeConnections: 48,
      errorRate: 0.2,
    },
    redis: {
      hitRate: BASELINE.redisHitRate,
      missRate: 100 - BASELINE.redisHitRate,
      memoryUsageMb: 128,
      keys: 14_200,
    },
    rabbitmq: {
      queueDepth: BASELINE.queueDepth,
      publishRate: 80,
      consumeRate: 78,
      overflow: false,
    },
    postgres: {
      latencyMs: BASELINE.postgresLatency,
      activeQueries: 6,
      connections: 22,
      cacheHitRatio: 97.5,
    },
    worker: {
      active: true,
      circuitBreaker: CircuitStates.Closed,
      processedPerSecond: BASELINE.workerRps,
      errorCount: 0,
    },
  }
}

export function createInitialNodeMetrics(): Record<string, NodeMetricsMap[NodeKind]> {
  const baseline = createBaselineMetrics()
  return {
    'gateway-1': baseline.gateway,
    'redis-1': baseline.redis,
    'rabbitmq-1': baseline.rabbitmq,
    'postgres-1': baseline.postgres,
    'worker-orders': baseline.worker,
    'worker-notify': {
      ...baseline.worker,
      processedPerSecond: 60,
    },
  }
}

function jitter(amplitude: number): number {
  return (Math.random() * 2 - 1) * amplitude
}

export function computeHealth(kind: NodeKind, metrics: NodeMetricsMap[NodeKind]): HealthLevel {
  switch (kind) {
    case NodeKinds.ApiGateway: {
      const m = metrics as ApiGatewayMetrics
      return healthFromThreshold(m.errorRate, 2, 8)
    }
    case NodeKinds.Redis: {
      const m = metrics as RedisMetrics
      return healthFromThreshold(m.hitRate, 75, 55, false)
    }
    case NodeKinds.RabbitMQ: {
      const m = metrics as RabbitMQMetrics
      if (m.overflow) return HealthLevels.Critical
      return healthFromThreshold(m.queueDepth, 1_500, QUEUE_OVERFLOW_THRESHOLD)
    }
    case NodeKinds.Postgres: {
      const m = metrics as PostgresMetrics
      return healthFromThreshold(m.latencyMs, 40, 120)
    }
    case NodeKinds.Worker: {
      const m = metrics as WorkerMetrics
      if (m.circuitBreaker === CircuitStates.Open) return HealthLevels.Critical
      if (m.circuitBreaker === CircuitStates.HalfOpen || !m.active) return HealthLevels.Warning
      return HealthLevels.Healthy
    }
    default:
      return HealthLevels.Healthy
  }
}

export interface TickResult {
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
  totalRps: number
  sample: ThroughputSample
  logs: SimulationLog[]
}

export function simulateTick(
  previous: Record<string, NodeMetricsMap[NodeKind]>,
  loadMultiplier: number,
  isLoadTestActive: boolean,
): TickResult {
  const intensity = isLoadTestActive ? loadMultiplier : 1
  const next: Record<string, NodeMetricsMap[NodeKind]> = {}
  const logs: SimulationLog[] = []
  const now = Date.now()

  const gatewayPrev = previous['gateway-1'] as ApiGatewayMetrics | undefined
  const gatewayRps = clamp(
    BASELINE.gatewayRps * intensity + jitter(18 * intensity),
    20,
    12_000,
  )
  const gateway: ApiGatewayMetrics = {
    requestsPerSecond: Math.round(gatewayRps),
    activeConnections: Math.round(48 * intensity + jitter(10)),
    errorRate: clamp(0.2 * intensity + jitter(0.3), 0, 25),
  }
  next['gateway-1'] = gateway

  const redisHitBase = isLoadTestActive
    ? clamp(BASELINE.redisHitRate - (intensity - 1) * 4 + jitter(2), 40, 99)
    : clamp(BASELINE.redisHitRate + jitter(1.5), 85, 99)
  const redis: RedisMetrics = {
    hitRate: Number(redisHitBase.toFixed(1)),
    missRate: Number((100 - redisHitBase).toFixed(1)),
    memoryUsageMb: Math.round(128 + intensity * 12 + jitter(8)),
    keys: Math.round(14_200 + intensity * 400 + jitter(200)),
  }
  next['redis-1'] = redis

  const publishRate = Math.round(80 * intensity + jitter(20))
  const consumeCapacity = isLoadTestActive
    ? Math.round(78 * Math.min(intensity * 0.55, intensity * 0.8) + jitter(15))
    : Math.round(78 + jitter(8))
  const prevQueue = (previous['rabbitmq-1'] as RabbitMQMetrics | undefined)?.queueDepth ?? BASELINE.queueDepth
  const queueDelta = publishRate - consumeCapacity
  const queueDepth = Math.max(0, Math.round(prevQueue + queueDelta * 0.35 + jitter(5)))
  const overflow = queueDepth >= QUEUE_OVERFLOW_THRESHOLD
  const rabbitmq: RabbitMQMetrics = {
    queueDepth,
    publishRate,
    consumeRate: consumeCapacity,
    overflow,
  }
  next['rabbitmq-1'] = rabbitmq

  if (overflow) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'error',
      source: 'rabbitmq-1',
      message: `Fila em overflow: ${queueDepth.toLocaleString('pt-BR')} mensagens acumuladas`,
    })
  } else if (queueDepth > 1_500 && isLoadTestActive) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'warn',
      source: 'rabbitmq-1',
      message: `Pressão na fila — profundidade em ${queueDepth.toLocaleString('pt-BR')}`,
    })
  }

  const postgresLatency = clamp(
    BASELINE.postgresLatency * (isLoadTestActive ? intensity * 0.9 : 1) + jitter(3),
    4,
    250,
  )
  const postgres: PostgresMetrics = {
    latencyMs: Number(postgresLatency.toFixed(1)),
    activeQueries: Math.round(6 * intensity + jitter(3)),
    connections: Math.round(22 + intensity * 8 + jitter(4)),
    cacheHitRatio: Number(clamp(97.5 - (intensity - 1) * 1.2 + jitter(0.4), 80, 99.5).toFixed(1)),
  }
  next['postgres-1'] = postgres

  if (postgresLatency > 80) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'warn',
      source: 'postgres-1',
      message: `Latência elevada no PostgreSQL: ${postgresLatency.toFixed(0)} ms`,
    })
  }

  const workerLoad = Math.round(BASELINE.workerRps * Math.min(intensity, 6) + jitter(12))
  const circuitOpen = isLoadTestActive && intensity >= 8 && queueDepth > 2_500
  const halfOpen = isLoadTestActive && !circuitOpen && intensity >= 5 && queueDepth > 800

  const workerOrders: WorkerMetrics = {
    active: !circuitOpen,
    circuitBreaker: circuitOpen
      ? CircuitStates.Open
      : halfOpen
        ? CircuitStates.HalfOpen
        : CircuitStates.Closed,
    processedPerSecond: circuitOpen ? 0 : workerLoad,
    errorCount: circuitOpen ? Math.round(12 + jitter(4)) : Math.max(0, Math.round(jitter(2))),
  }
  next['worker-orders'] = workerOrders

  if (circuitOpen && (previous['worker-orders'] as WorkerMetrics | undefined)?.circuitBreaker !== CircuitStates.Open) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'error',
      source: 'worker-orders',
      message: 'Circuit Breaker ABERTO — worker orders isolado do tráfego',
    })
  }

  const workerNotify: WorkerMetrics = {
    active: true,
    circuitBreaker: halfOpen ? CircuitStates.HalfOpen : CircuitStates.Closed,
    processedPerSecond: Math.round(60 * Math.min(intensity * 0.7, 5) + jitter(8)),
    errorCount: Math.max(0, Math.round(jitter(1.5))),
  }
  next['worker-notify'] = workerNotify

  // Preserve any dynamically added nodes with mild scaling
  for (const [id, metrics] of Object.entries(previous)) {
    if (id in next) continue
    next[id] = scaleGenericMetrics(metrics, intensity)
  }

  if (isLoadTestActive && Math.random() > 0.7) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'info',
      source: 'load-simulator',
      message: `Pico ativo — throughput ~${gateway.requestsPerSecond.toLocaleString('pt-BR')} RPS (×${intensity.toFixed(0)})`,
    })
  }

  if (!isLoadTestActive && gatewayPrev && gatewayPrev.requestsPerSecond > 500) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'success',
      source: 'load-simulator',
      message: 'Tráfego normalizado após o pico de carga',
    })
  }

  return {
    nodeMetrics: next,
    totalRps: gateway.requestsPerSecond,
    sample: {
      timestamp: now,
      rps: gateway.requestsPerSecond,
      queueDepth: rabbitmq.queueDepth,
      latencyMs: postgres.latencyMs,
    },
    logs,
  }
}

function scaleGenericMetrics(
  metrics: NodeMetricsMap[NodeKind],
  intensity: number,
): NodeMetricsMap[NodeKind] {
  if ('requestsPerSecond' in metrics) {
    return {
      ...metrics,
      requestsPerSecond: Math.round(metrics.requestsPerSecond * (0.9 + intensity * 0.1)),
    }
  }
  return metrics
}

export function appendHistory(
  history: ThroughputSample[],
  sample: ThroughputSample,
): ThroughputSample[] {
  const next = [...history, sample]
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
}

export function appendLogs(
  existing: SimulationLog[],
  incoming: SimulationLog[],
): SimulationLog[] {
  if (incoming.length === 0) return existing
  const next = [...incoming.reverse(), ...existing]
  return next.length > MAX_LOGS ? next.slice(0, MAX_LOGS) : next
}
