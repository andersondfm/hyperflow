import type {
  ApiGatewayMetrics,
  ChaosFault,
  ContainerMetrics,
  DlqMetrics,
  HealthLevel,
  IntegrationTestMetrics,
  MitigationId,
  NodeKind,
  NodeMetricsMap,
  PostgresMetrics,
  RabbitMQMetrics,
  RedisMetrics,
  SimulationLog,
  SonarMetrics,
  ThroughputSample,
  WorkerMetrics,
} from '@/types/nodes'
import { MitigationIds } from '@/types/nodes'
import {
  ChaosFaults,
  CircuitStates,
  HealthLevels,
  NodeKinds,
  QualityGates,
  TestRunStatuses,
} from '@/types/nodes'
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
const QUEUE_WARNING_THRESHOLD = 1_500
const MAX_DEAD_LETTERS = 25_000
const PER_WORKER_CONSUME = 39
const PER_CONTAINER_CONSUME = 44
const AUTOSCALE_VIRTUAL_REPLICAS = 3
const RATE_LIMIT_TARGET_INTENSITY = 2.4
const RATE_LIMIT_LERP = 0.2
const CACHE_TARGET_HIT = 97.6
const CACHE_LERP = 0.24
const QUEUE_MIN_DROP_RATIO = 0.11
const QUEUE_MAX_DROP_RATIO = 0.17

export interface BaselineMetrics {
  gateway: ApiGatewayMetrics
  redis: RedisMetrics
  rabbitmq: RabbitMQMetrics
  postgres: PostgresMetrics
  worker: WorkerMetrics
  container: ContainerMetrics
  integrationTest: IntegrationTestMetrics
  sonar: SonarMetrics
  dlq: DlqMetrics
}

export function createMetricsForKind(kind: NodeKind): NodeMetricsMap[NodeKind] {
  switch (kind) {
    case NodeKinds.ApiGateway:
      return {
        requestsPerSecond: BASELINE.gatewayRps,
        activeConnections: 48,
        errorRate: 0.2,
      }
    case NodeKinds.Redis:
      return {
        hitRate: BASELINE.redisHitRate,
        missRate: 100 - BASELINE.redisHitRate,
        memoryUsageMb: 128,
        keys: 14_200,
      }
    case NodeKinds.RabbitMQ:
      return {
        queueDepth: BASELINE.queueDepth,
        publishRate: 80,
        consumeRate: 78,
        overflow: false,
      }
    case NodeKinds.Postgres:
      return {
        latencyMs: BASELINE.postgresLatency,
        activeQueries: 6,
        connections: 22,
        cacheHitRatio: 97.5,
      }
    case NodeKinds.Worker:
      return {
        active: true,
        circuitBreaker: CircuitStates.Closed,
        processedPerSecond: BASELINE.workerRps,
        errorCount: 0,
      }
    case NodeKinds.Container:
      return {
        replicas: 1,
        cpuPercent: 22,
        processedPerSecond: 40,
      }
    case NodeKinds.IntegrationTest:
      return {
        lastRunStatus: TestRunStatuses.Pass,
        coveragePercent: 84.2,
      }
    case NodeKinds.Sonar:
      return {
        bugs: 3,
        vulnerabilities: 1,
        qualityGate: QualityGates.Ok,
      }
    case NodeKinds.Dlq:
      return {
        deadLetters: 0,
        lastReason: '—',
      }
  }
}

export function createBaselineMetrics(): BaselineMetrics {
  return {
    gateway: createMetricsForKind(NodeKinds.ApiGateway) as ApiGatewayMetrics,
    redis: createMetricsForKind(NodeKinds.Redis) as RedisMetrics,
    rabbitmq: createMetricsForKind(NodeKinds.RabbitMQ) as RabbitMQMetrics,
    postgres: createMetricsForKind(NodeKinds.Postgres) as PostgresMetrics,
    worker: createMetricsForKind(NodeKinds.Worker) as WorkerMetrics,
    container: createMetricsForKind(NodeKinds.Container) as ContainerMetrics,
    integrationTest: createMetricsForKind(NodeKinds.IntegrationTest) as IntegrationTestMetrics,
    sonar: createMetricsForKind(NodeKinds.Sonar) as SonarMetrics,
    dlq: createMetricsForKind(NodeKinds.Dlq) as DlqMetrics,
  }
}

export function createInitialNodeKinds(): Record<string, NodeKind> {
  return {
    'gateway-1': NodeKinds.ApiGateway,
    'redis-1': NodeKinds.Redis,
    'rabbitmq-1': NodeKinds.RabbitMQ,
    'postgres-1': NodeKinds.Postgres,
    'worker-orders': NodeKinds.Worker,
    'worker-notify': NodeKinds.Worker,
    'dlq-1': NodeKinds.Dlq,
  }
}

export function createInitialNodeMetrics(): Record<string, NodeMetricsMap[NodeKind]> {
  const worker = createMetricsForKind(NodeKinds.Worker) as WorkerMetrics
  return {
    'gateway-1': createMetricsForKind(NodeKinds.ApiGateway),
    'redis-1': createMetricsForKind(NodeKinds.Redis),
    'rabbitmq-1': createMetricsForKind(NodeKinds.RabbitMQ),
    'postgres-1': createMetricsForKind(NodeKinds.Postgres),
    'worker-orders': worker,
    'worker-notify': {
      ...worker,
      processedPerSecond: 60,
    },
    'dlq-1': createMetricsForKind(NodeKinds.Dlq),
  }
}

export function metricsForRegisteredKinds(
  nodeKinds: Record<string, NodeKind>,
): Record<string, NodeMetricsMap[NodeKind]> {
  const next: Record<string, NodeMetricsMap[NodeKind]> = {}
  for (const [id, kind] of Object.entries(nodeKinds)) {
    const metrics = createMetricsForKind(kind)
    if (id === 'worker-notify' && kind === NodeKinds.Worker) {
      next[id] = { ...(metrics as WorkerMetrics), processedPerSecond: 60 }
    } else {
      next[id] = metrics
    }
  }
  return next
}

function jitter(amplitude: number): number {
  return (Math.random() * 2 - 1) * amplitude
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function idsOfKind(kinds: Record<string, NodeKind>, kind: NodeKind): string[] {
  const ids: string[] = []
  for (const [id, k] of Object.entries(kinds)) {
    if (k === kind) ids.push(id)
  }
  return ids
}

function countKind(kinds: Record<string, NodeKind>, kind: NodeKind): number {
  return idsOfKind(kinds, kind).length
}

function getFault(
  failedNodeIds: Record<string, ChaosFault>,
  id: string,
): ChaosFault | undefined {
  return failedNodeIds[id]
}

function consumeWeight(fault: ChaosFault | undefined): number {
  if (!fault) return 1
  if (fault === ChaosFaults.Down) return 0
  if (fault === ChaosFaults.Oom) return 0.12
  return 0.28
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
      return healthFromThreshold(m.queueDepth, QUEUE_WARNING_THRESHOLD, QUEUE_OVERFLOW_THRESHOLD)
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
    case NodeKinds.Container: {
      const m = metrics as ContainerMetrics
      return healthFromThreshold(m.cpuPercent, 70, 88)
    }
    case NodeKinds.IntegrationTest: {
      const m = metrics as IntegrationTestMetrics
      if (m.lastRunStatus === TestRunStatuses.Fail) return HealthLevels.Critical
      if (m.lastRunStatus === TestRunStatuses.Running) return HealthLevels.Warning
      return HealthLevels.Healthy
    }
    case NodeKinds.Sonar: {
      const m = metrics as SonarMetrics
      if (m.qualityGate === QualityGates.Failed) return HealthLevels.Critical
      if (m.bugs >= 12 || m.vulnerabilities >= 4) return HealthLevels.Warning
      return HealthLevels.Healthy
    }
    case NodeKinds.Dlq: {
      const m = metrics as DlqMetrics
      return healthFromThreshold(m.deadLetters, 80, 800)
    }
  }
}

export interface TickContext {
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
  nodeKinds: Record<string, NodeKind>
  failedNodeIds: Record<string, ChaosFault>
  loadMultiplier: number
  isLoadTestActive: boolean
  deadLetters: number
  activeMitigations: Record<MitigationId, boolean>
}

export interface TickResult {
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
  totalRps: number
  estimatedCostPerHour: number
  deadLetters: number
  sample: ThroughputSample
  logs: SimulationLog[]
}

export function computeEstimatedCost(opts: {
  intensity: number
  isLoadTestActive: boolean
  totalRps: number
  redisHitRate: number
  counts: Record<NodeKind, number>
  postgresDown: boolean
  redisFault: boolean
  autoscaleReplicas?: number
}): number {
  const {
    intensity,
    isLoadTestActive,
    totalRps,
    redisHitRate,
    counts,
    postgresDown,
    redisFault,
    autoscaleReplicas = 0,
  } = opts

  const inventory =
    counts[NodeKinds.ApiGateway] * 0.9 +
    counts[NodeKinds.Redis] * 1.5 +
    counts[NodeKinds.RabbitMQ] * 1.2 +
    counts[NodeKinds.Postgres] * 2.8 +
    counts[NodeKinds.Worker] * 1.9 +
    counts[NodeKinds.Container] * 2.4 +
    counts[NodeKinds.IntegrationTest] * 0.35 +
    counts[NodeKinds.Sonar] * 0.45 +
    counts[NodeKinds.Dlq] * 0.15 +
    autoscaleReplicas * 2.4

  const rpsFactor = Math.max(totalRps, 0) / 120
  const cacheMiss = clamp((100 - redisHitRate) / 100, 0.02, 1)
  const computeScale = isLoadTestActive ? 1 + (intensity - 1) * 0.55 : 1
  const computeUnits = counts[NodeKinds.Worker] + counts[NodeKinds.Container] + autoscaleReplicas
  const postgresFactor = counts[NodeKinds.Postgres] === 0 ? 0 : counts[NodeKinds.Postgres]

  let traffic =
    rpsFactor * 0.75 +
    postgresFactor * 22.5 * cacheMiss * computeScale +
    computeUnits * 0.9 * Math.max(computeScale - 1, 0)

  if (postgresDown) {
    traffic = traffic * 0.45 + 6
  }
  if (redisFault) {
    traffic *= 1.08
  }

  return Number(clamp(inventory + traffic, 3, 280).toFixed(2))
}

export function simulateTick(ctx: TickContext): TickResult {
  const { nodeMetrics: previous, nodeKinds, failedNodeIds, loadMultiplier, isLoadTestActive } = ctx
  const intensity = isLoadTestActive ? loadMultiplier : 1
  const rateLimit = Boolean(ctx.activeMitigations[MitigationIds.RateLimit])
  const autoscale = Boolean(ctx.activeMitigations[MitigationIds.Autoscale])
  const aggressiveCache = Boolean(ctx.activeMitigations[MitigationIds.AggressiveCache])
  const readReplica = Boolean(ctx.activeMitigations[MitigationIds.ReadReplica])
  const queueRelief = rateLimit || autoscale
  const next: Record<string, NodeMetricsMap[NodeKind]> = {}
  const logs: SimulationLog[] = []
  const now = Date.now()

  const gatewayIds = idsOfKind(nodeKinds, NodeKinds.ApiGateway)
  const redisIds = idsOfKind(nodeKinds, NodeKinds.Redis)
  const rabbitIds = idsOfKind(nodeKinds, NodeKinds.RabbitMQ)
  const postgresIds = idsOfKind(nodeKinds, NodeKinds.Postgres)
  const workerIds = idsOfKind(nodeKinds, NodeKinds.Worker)
  const containerIds = idsOfKind(nodeKinds, NodeKinds.Container)
  const testIds = idsOfKind(nodeKinds, NodeKinds.IntegrationTest)
  const sonarIds = idsOfKind(nodeKinds, NodeKinds.Sonar)
  const dlqIds = idsOfKind(nodeKinds, NodeKinds.Dlq)

  const anyChaos = Object.keys(failedNodeIds).length > 0
  const postgresDown =
    postgresIds.length > 0 && postgresIds.every((id) => getFault(failedNodeIds, id) === ChaosFaults.Down)
  const redisFault = redisIds.some((id) => {
    const fault = getFault(failedNodeIds, id)
    return fault === ChaosFaults.Oom || fault === ChaosFaults.Down
  })
  const allRedisDown =
    redisIds.length === 0 ||
    redisIds.every((id) => {
      const fault = getFault(failedNodeIds, id)
      return fault === ChaosFaults.Down || fault === ChaosFaults.Oom
    })
  const workerFaultCount = workerIds.filter((id) => Boolean(getFault(failedNodeIds, id))).length

  let totalRps = 0
  let backendErrorAcc = 0

  for (const id of gatewayIds) {
    const fault = getFault(failedNodeIds, id)
    const weight = consumeWeight(fault)
    const uncappedRps = clamp(
      BASELINE.gatewayRps * intensity * weight + jitter(18 * intensity * Math.max(weight, 0.15)),
      0,
      12_000,
    )
    const capRps = BASELINE.gatewayRps * RATE_LIMIT_TARGET_INTENSITY * Math.max(weight, 0.15)
    const prevGateway = previous[id] as ApiGatewayMetrics | undefined
    let rps = uncappedRps
    if (rateLimit && isLoadTestActive && (uncappedRps > capRps || (prevGateway?.requestsPerSecond ?? 0) > capRps)) {
      rps = lerp(prevGateway?.requestsPerSecond ?? uncappedRps, capRps, RATE_LIMIT_LERP)
    }

    const backendError = postgresDown
      ? clamp(18 + jitter(4), 12, 36)
      : allRedisDown
        ? clamp(2.4 * intensity + jitter(0.8), 1, 28)
        : clamp(0.2 * intensity + jitter(0.3), 0, 25)
    const throttleError =
      rateLimit && isLoadTestActive && !postgresDown ? clamp(7.0 + jitter(0.5), 6.2, 7.8) : 0
    const errorRate = Number(clamp(backendError + throttleError, 0, 36).toFixed(1))

    const connTarget = rateLimit && isLoadTestActive ? 48 * RATE_LIMIT_TARGET_INTENSITY : 48 * intensity
    const prevConn = prevGateway?.activeConnections ?? connTarget
    const connections =
      rateLimit && isLoadTestActive ? lerp(prevConn, connTarget, RATE_LIMIT_LERP) : connTarget

    const metrics: ApiGatewayMetrics = {
      requestsPerSecond: Math.round(rps),
      activeConnections: Math.round((connections + jitter(10)) * Math.max(weight, 0.2)),
      errorRate,
    }
    next[id] = metrics
    totalRps += metrics.requestsPerSecond
    backendErrorAcc += backendError
  }

  totalRps = Math.round(totalRps)
  const gatewayFactor = gatewayIds.length === 0 ? 0 : 1
  const avgBackendError = gatewayIds.length > 0 ? backendErrorAcc / gatewayIds.length : 0
  const ingressIntensity =
    gatewayIds.length === 0
      ? intensity
      : clamp(totalRps / (BASELINE.gatewayRps * gatewayIds.length), 0.4, 12)

  const extraRedisBoost = Math.max(0, redisIds.length - 1) * 1.4
  let aggregateHit = 0
  let healthyRedisCount = 0

  for (const id of redisIds) {
    const fault = getFault(failedNodeIds, id)
    if (fault === ChaosFaults.Down || fault === ChaosFaults.Oom) {
      const oom = fault === ChaosFaults.Oom
      const redis: RedisMetrics = {
        hitRate: Number(clamp(4 + jitter(2), 1, 12).toFixed(1)),
        missRate: Number(clamp(94 + jitter(2), 88, 99).toFixed(1)),
        memoryUsageMb: oom ? Math.round(512 + jitter(8)) : Math.round(40 + jitter(6)),
        keys: oom ? Math.round(2_400 + jitter(200)) : Math.round(800 + jitter(80)),
      }
      next[id] = redis
      continue
    }

    const naturalHit = isLoadTestActive
      ? clamp(BASELINE.redisHitRate + extraRedisBoost - (intensity - 1) * 4 + jitter(2), 40, 99)
      : clamp(BASELINE.redisHitRate + extraRedisBoost + jitter(1.5), 85, 99)
    const prevRedis = previous[id] as RedisMetrics | undefined
    const targetHit = clamp(CACHE_TARGET_HIT + extraRedisBoost, 96, 99.2)
    const hitBase = aggressiveCache
      ? lerp(prevRedis?.hitRate ?? naturalHit, targetHit, CACHE_LERP)
      : naturalHit
    const redis: RedisMetrics = {
      hitRate: Number(hitBase.toFixed(1)),
      missRate: Number((100 - hitBase).toFixed(1)),
      memoryUsageMb: Math.round(128 + intensity * 12 + jitter(8)),
      keys: Math.round(14_200 + intensity * 400 + jitter(200)),
    }
    next[id] = redis
    aggregateHit += redis.hitRate
    healthyRedisCount += 1
  }

  const redisHitRate =
    redisIds.length === 0 ? 0 : healthyRedisCount === 0 ? 5 : aggregateHit / healthyRedisCount

  let consumeCapacity = 0
  for (const id of workerIds) {
    const weight = consumeWeight(getFault(failedNodeIds, id))
    const base = isLoadTestActive
      ? PER_WORKER_CONSUME * Math.min(intensity * 0.55, intensity * 0.8)
      : PER_WORKER_CONSUME
    consumeCapacity += (base + jitter(4)) * weight
  }
  for (const id of containerIds) {
    const weight = consumeWeight(getFault(failedNodeIds, id))
    const base = isLoadTestActive
      ? PER_CONTAINER_CONSUME * Math.min(intensity * 0.55, intensity * 0.8)
      : PER_CONTAINER_CONSUME
    consumeCapacity += (base + jitter(4)) * weight
  }
  consumeCapacity = Math.max(0, Math.round(consumeCapacity))
  const physicalConsume = consumeCapacity

  if (autoscale) {
    const virtualBase = isLoadTestActive
      ? PER_CONTAINER_CONSUME * Math.min(intensity * 0.55, intensity * 0.8)
      : PER_CONTAINER_CONSUME
    consumeCapacity += Math.round(virtualBase * AUTOSCALE_VIRTUAL_REPLICAS)
  }

  const publishRate = Math.round(80 * ingressIntensity * gatewayFactor + jitter(20 * gatewayFactor))
  const prevQueueTotal = rabbitIds.reduce((sum, id) => {
    const m = previous[id] as RabbitMQMetrics | undefined
    return sum + (m?.queueDepth ?? 0)
  }, 0)
  const queueDelta = publishRate - consumeCapacity
  let nextQueueTotal = Math.max(0, Math.round(prevQueueTotal + queueDelta * 0.35 + jitter(5)))
  if (isLoadTestActive && queueRelief && prevQueueTotal > BASELINE.queueDepth) {
    const minNext = Math.round(prevQueueTotal * (1 - QUEUE_MAX_DROP_RATIO))
    const maxNext = Math.round(prevQueueTotal * (1 - QUEUE_MIN_DROP_RATIO))
    nextQueueTotal = clamp(Math.min(nextQueueTotal, maxNext), minNext, prevQueueTotal)
    nextQueueTotal = Math.max(BASELINE.queueDepth, nextQueueTotal)
  }
  const brokerCount = rabbitIds.length
  let hottestQueue = 0
  let anyOverflow = false

  for (const id of rabbitIds) {
    const share = brokerCount > 0 ? Math.max(0, Math.round(nextQueueTotal / brokerCount + jitter(4))) : 0
    const overflow = share >= QUEUE_OVERFLOW_THRESHOLD
    const rabbit: RabbitMQMetrics = {
      queueDepth: share,
      publishRate: brokerCount > 0 ? Math.round(publishRate / brokerCount) : 0,
      consumeRate: brokerCount > 0 ? Math.round(consumeCapacity / brokerCount) : 0,
      overflow,
    }
    next[id] = rabbit
    hottestQueue = Math.max(hottestQueue, share)
    if (overflow) anyOverflow = true
  }

  if (anyOverflow) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'error',
      source: rabbitIds[0] ?? 'rabbitmq',
      message: `Fila em overflow: ${hottestQueue.toLocaleString('pt-BR')} mensagens no broker mais quente`,
    })
  } else if (hottestQueue > QUEUE_WARNING_THRESHOLD && isLoadTestActive && !queueRelief) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'warn',
      source: rabbitIds[0] ?? 'rabbitmq',
      message: `Pressão na fila — profundidade em ${hottestQueue.toLocaleString('pt-BR')}`,
    })
  }

  const extraPgRelief = Math.max(0, postgresIds.length - 1) * 0.12
  let worstPgLatency = 0

  for (const id of postgresIds) {
    const fault = getFault(failedNodeIds, id)
    if (fault === ChaosFaults.Down) {
      const postgres: PostgresMetrics = {
        latencyMs: Number(clamp(240 + jitter(12), 200, 280).toFixed(1)),
        activeQueries: 0,
        connections: 0,
        cacheHitRatio: 0,
      }
      next[id] = postgres
      worstPgLatency = Math.max(worstPgLatency, postgres.latencyMs)
      continue
    }

    const missPenalty = allRedisDown ? 2.4 : 1 + ((100 - redisHitRate) / 100) * 0.8
    const replicaRelief = readReplica ? 0.42 : 1
    const rawLatency = clamp(
      (BASELINE.postgresLatency * (isLoadTestActive ? ingressIntensity * 0.9 : 1) * missPenalty * replicaRelief) /
        (1 + extraPgRelief) +
        jitter(3),
      4,
      250,
    )
    const prevPg = previous[id] as PostgresMetrics | undefined
    const postgresLatency =
      (readReplica || aggressiveCache) && prevPg
        ? lerp(prevPg.latencyMs, rawLatency, 0.22)
        : rawLatency
    const connBase = 22 + ingressIntensity * 8
    const postgres: PostgresMetrics = {
      latencyMs: Number(postgresLatency.toFixed(1)),
      activeQueries: Math.max(0, Math.round(6 * ingressIntensity * missPenalty * (readReplica ? 0.55 : 1) + jitter(3))),
      connections: Math.max(1, Math.round((readReplica ? connBase * 0.5 : connBase) + jitter(4))),
      cacheHitRatio: Number(
        clamp(97.5 - (ingressIntensity - 1) * 1.2 + (readReplica ? 1.4 : 0) + jitter(0.4), 80, 99.5).toFixed(1),
      ),
    }
    next[id] = postgres
    worstPgLatency = Math.max(worstPgLatency, postgres.latencyMs)
  }

  if (postgresDown && Math.random() > 0.55) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'error',
      source: postgresIds[0] ?? 'postgres',
      message:
        'PostgreSQL DOWN — escritas falham. Degradação graciosa: leituras ainda podem ser servidas pelo Redis',
    })
  } else if (worstPgLatency > 80) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'warn',
      source: postgresIds[0] ?? 'postgres',
      message: `Latência elevada no PostgreSQL: ${worstPgLatency.toFixed(0)} ms`,
    })
  }

  const circuitOpen =
    postgresDown ||
    (!queueRelief && isLoadTestActive && intensity >= 8 && hottestQueue > 2_500) ||
    avgBackendError >= 12
  const halfOpen =
    !circuitOpen &&
    (!queueRelief && isLoadTestActive && intensity >= 5 && hottestQueue > 800)

  const healthyConsumers = workerIds.length + containerIds.length
  const perConsumer = healthyConsumers > 0 ? physicalConsume / healthyConsumers : 0

  for (const id of workerIds) {
    const fault = getFault(failedNodeIds, id)
    const isolated = fault === ChaosFaults.Down || circuitOpen
    const worker: WorkerMetrics = {
      active: !isolated,
      circuitBreaker: isolated
        ? CircuitStates.Open
        : fault === ChaosFaults.Timeout || halfOpen
          ? CircuitStates.HalfOpen
          : CircuitStates.Closed,
      processedPerSecond: isolated
        ? 0
        : Math.round(perConsumer * consumeWeight(fault) + jitter(8)),
      errorCount: isolated
        ? Math.round(12 + jitter(4))
        : postgresDown
          ? Math.round(8 + jitter(3))
          : Math.max(0, Math.round(Math.abs(jitter(2)))),
    }
    next[id] = worker

    const prevWorker = previous[id] as WorkerMetrics | undefined
    if (isolated && prevWorker?.circuitBreaker !== CircuitStates.Open) {
      logs.push({
        id: createId('log'),
        timestamp: now,
        level: 'error',
        source: id,
        message: fault
          ? `Worker isolado por chaos (${fault}) — tráfego desviado`
          : 'Circuit Breaker ABERTO — worker isolado do tráfego',
      })
    }
  }

  for (const id of containerIds) {
    const fault = getFault(failedNodeIds, id)
    const weight = consumeWeight(fault)
    const rawCpu = fault
      ? clamp(fault === ChaosFaults.Down ? 2 + jitter(1) : 96 + jitter(2), 0, 100)
      : clamp((isLoadTestActive ? 28 * Math.min(intensity, 4) : 22) + jitter(8), 6, 99)
    const cpu = autoscale && !fault ? clamp(rawCpu * 0.52, 10, 72) : rawCpu
    const container: ContainerMetrics = {
      replicas: autoscale ? 1 + AUTOSCALE_VIRTUAL_REPLICAS : 1,
      cpuPercent: Number(cpu.toFixed(1)),
      processedPerSecond: Math.round(perConsumer * weight + jitter(6)),
    }
    next[id] = container
  }

  let dlqReason = '—'
  let dlqDelta = 0
  if (anyOverflow) {
    dlqDelta += Math.round(48 + jitter(16))
    dlqReason = 'Overflow na fila'
  }
  if (circuitOpen) {
    dlqDelta += Math.round(28 + jitter(10))
    dlqReason = 'Circuit breaker aberto'
  }
  if (postgresDown) {
    dlqDelta += Math.round(60 + jitter(18))
    dlqReason = 'PostgreSQL indisponível'
  }
  if (workerFaultCount > 0) {
    dlqDelta += Math.round(22 * workerFaultCount + jitter(8))
    dlqReason = 'Worker isolado'
  }
  if (isLoadTestActive && !queueRelief && hottestQueue > QUEUE_WARNING_THRESHOLD) {
    dlqDelta += Math.round(10 + jitter(4))
    if (dlqReason === '—') dlqReason = 'Pressão no pico de carga'
  }

  const deadLetters = clamp(Math.round(ctx.deadLetters + Math.max(0, dlqDelta)), 0, MAX_DEAD_LETTERS)

  for (const id of dlqIds) {
    const dlq: DlqMetrics = {
      deadLetters,
      lastReason: deadLetters > 0 ? dlqReason : '—',
    }
    next[id] = dlq
  }

  if (dlqDelta > 12 && (anyOverflow || postgresDown || circuitOpen) && Math.random() > 0.45) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'warn',
      source: dlqIds[0] ?? 'dlq',
      message: `DLQ — +${Math.round(dlqDelta)} mensagens mortas (${dlqReason})`,
    })
  }

  for (const id of testIds) {
    const failing =
      postgresDown ||
      redisFault ||
      (isLoadTestActive && !queueRelief && intensity >= 8 && Math.random() > 0.35)
    const running = isLoadTestActive && !failing
    const test: IntegrationTestMetrics = {
      lastRunStatus: failing
        ? TestRunStatuses.Fail
        : running
          ? TestRunStatuses.Running
          : TestRunStatuses.Pass,
      coveragePercent: Number(
        clamp(84.2 - (intensity - 1) * 2.1 - (anyChaos ? 8 : 0) + jitter(1.2), 38, 96).toFixed(1),
      ),
    }
    next[id] = test
    if (failing && Math.random() > 0.7) {
      logs.push({
        id: createId('log'),
        timestamp: now,
        level: 'error',
        source: id,
        message: 'Teste integrado FALHOU — pipeline de qualidade vermelho no pico/chaos',
      })
    }
  }

  for (const id of sonarIds) {
    const bugs = Math.max(0, Math.round(3 + (intensity - 1) * 2.4 + (anyChaos ? 10 : 0) + jitter(2)))
    const vulnerabilities = Math.max(
      0,
      Math.round(1 + (redisFault || postgresDown ? 4 : 0) + (intensity > 5 ? 2 : 0) + jitter(1)),
    )
    const qualityGate =
      bugs > 12 || vulnerabilities > 3 ? QualityGates.Failed : QualityGates.Ok
    const sonar: SonarMetrics = { bugs, vulnerabilities, qualityGate }
    next[id] = sonar
    if (qualityGate === QualityGates.Failed && Math.random() > 0.75) {
      logs.push({
        id: createId('log'),
        timestamp: now,
        level: 'warn',
        source: id,
        message: `SonarQube — Quality Gate FAILED (${bugs} bugs, ${vulnerabilities} vulns)`,
      })
    }
  }

  const counts = {
    [NodeKinds.ApiGateway]: countKind(nodeKinds, NodeKinds.ApiGateway),
    [NodeKinds.Redis]: countKind(nodeKinds, NodeKinds.Redis),
    [NodeKinds.RabbitMQ]: countKind(nodeKinds, NodeKinds.RabbitMQ),
    [NodeKinds.Postgres]: countKind(nodeKinds, NodeKinds.Postgres),
    [NodeKinds.Worker]: countKind(nodeKinds, NodeKinds.Worker),
    [NodeKinds.Container]: countKind(nodeKinds, NodeKinds.Container),
    [NodeKinds.IntegrationTest]: countKind(nodeKinds, NodeKinds.IntegrationTest),
    [NodeKinds.Sonar]: countKind(nodeKinds, NodeKinds.Sonar),
    [NodeKinds.Dlq]: countKind(nodeKinds, NodeKinds.Dlq),
  }

  const estimatedCostPerHour = computeEstimatedCost({
    intensity: ingressIntensity,
    isLoadTestActive,
    totalRps,
    redisHitRate,
    counts,
    postgresDown,
    redisFault,
    autoscaleReplicas: autoscale ? AUTOSCALE_VIRTUAL_REPLICAS : 0,
  })

  if (isLoadTestActive && Math.random() > 0.78) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'info',
      source: 'finops',
      message: `FinOps — custo estimado ${estimatedCostPerHour.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}/hora`,
    })
  }

  if (rateLimit && isLoadTestActive && Math.random() > 0.82) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'warn',
      source: gatewayIds[0] ?? 'gateway',
      message: 'Gateway — 429 Too Many Requests (throttle). Ingress limitado',
    })
  }

  if (queueRelief && isLoadTestActive && nextQueueTotal < prevQueueTotal && Math.random() > 0.78) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'success',
      source: rabbitIds[0] ?? 'rabbitmq',
      message: `Fila drenando — profundidade ${Math.round(nextQueueTotal).toLocaleString('pt-BR')}`,
    })
  }

  if (isLoadTestActive && Math.random() > 0.7) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'info',
      source: 'load-simulator',
      message: `Pico ativo — throughput ~${totalRps.toLocaleString('pt-BR')} RPS (×${ingressIntensity.toFixed(0)})`,
    })
  }

  const gatewayPrev = gatewayIds[0]
    ? (previous[gatewayIds[0]] as ApiGatewayMetrics | undefined)
    : undefined
  if (!isLoadTestActive && gatewayPrev && gatewayPrev.requestsPerSecond > 500) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'success',
      source: 'load-simulator',
      message: 'Tráfego normalizado após o pico de carga',
    })
  }

  if (redisFault && Math.random() > 0.55) {
    logs.push({
      id: createId('log'),
      timestamp: now,
      level: 'error',
      source: redisIds[0] ?? 'redis',
      message: 'Redis degradado — hit rate colapsou, tráfego vazando para o PostgreSQL (custo sobe)',
    })
  }

  return {
    nodeMetrics: next,
    totalRps,
    estimatedCostPerHour,
    deadLetters,
    sample: {
      timestamp: now,
      rps: totalRps,
      queueDepth: hottestQueue,
      latencyMs: worstPgLatency,
      costPerHour: estimatedCostPerHour,
    },
    logs,
  }
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

export function findMetricsByKind<K extends NodeKind>(
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>,
  nodeKinds: Record<string, NodeKind>,
  kind: K,
): NodeMetricsMap[K] | undefined {
  for (const [id, k] of Object.entries(nodeKinds)) {
    if (k !== kind) continue
    const metrics = nodeMetrics[id]
    if (metrics) return metrics as NodeMetricsMap[K]
  }
  return undefined
}

export function hottestRabbitMetrics(
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>,
  nodeKinds: Record<string, NodeKind>,
): RabbitMQMetrics | undefined {
  let hottest: RabbitMQMetrics | undefined
  for (const [id, kind] of Object.entries(nodeKinds)) {
    if (kind !== NodeKinds.RabbitMQ) continue
    const metrics = nodeMetrics[id] as RabbitMQMetrics | undefined
    if (!metrics) continue
    if (!hottest || metrics.queueDepth > hottest.queueDepth) hottest = metrics
  }
  return hottest
}
