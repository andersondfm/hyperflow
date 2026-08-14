import { create } from 'zustand'
import type {
  ChaosFault,
  NodeKind,
  NodeMetricsMap,
  RabbitMQMetrics,
  SimulationLog,
  ThroughputSample,
} from '@/types/nodes'
import { NodeKinds } from '@/types/nodes'
import {
  appendHistory,
  appendLogs,
  createInitialNodeKinds,
  createInitialNodeMetrics,
  createMetricsForKind,
  metricsForRegisteredKinds,
  simulateTick,
} from '@/lib/simulationEngine'
import { createId, kindLabel } from '@/lib/utils'

interface SimulationState {
  isLoadTestActive: boolean
  loadMultiplier: number
  totalRps: number
  estimatedCostPerHour: number
  deadLetters: number
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
  nodeKinds: Record<string, NodeKind>
  failedNodeIds: Record<string, ChaosFault>
  throughputHistory: ThroughputSample[]
  logs: SimulationLog[]
  tick: () => void
  triggerLoadSpike: () => void
  stopLoadSpike: () => void
  resetSimulation: () => void
  pushLog: (log: Omit<SimulationLog, 'id' | 'timestamp'> & { timestamp?: number }) => void
  registerNode: (id: string, kind: NodeKind) => void
  unregisterNode: (id: string) => void
  injectChaos: (nodeId: string, fault: ChaosFault) => void
  clearChaos: (nodeId: string) => void
  clearAllChaos: () => void
  requeueDlq: () => void
}

const SPIKE_MULTIPLIER = 10
const SPIKE_DURATION_MS = 18_000
const BASELINE_COST = 12.5

let spikeTimeout: ReturnType<typeof setTimeout> | null = null

function bootLog(): SimulationLog {
  return {
    id: createId('log'),
    timestamp: Date.now(),
    level: 'info',
    source: 'hyperflow',
    message: 'Simulador inicializado — topologia de referência pronta',
  }
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isLoadTestActive: false,
  loadMultiplier: 1,
  totalRps: 120,
  estimatedCostPerHour: BASELINE_COST,
  deadLetters: 0,
  nodeMetrics: createInitialNodeMetrics(),
  nodeKinds: createInitialNodeKinds(),
  failedNodeIds: {},
  throughputHistory: [],
  logs: [bootLog()],

  tick: () => {
    const {
      nodeMetrics,
      nodeKinds,
      failedNodeIds,
      loadMultiplier,
      isLoadTestActive,
      deadLetters,
      throughputHistory,
      logs,
    } = get()
    const result = simulateTick({
      nodeMetrics,
      nodeKinds,
      failedNodeIds,
      loadMultiplier,
      isLoadTestActive,
      deadLetters,
    })
    set({
      nodeMetrics: result.nodeMetrics,
      totalRps: result.totalRps,
      estimatedCostPerHour: result.estimatedCostPerHour,
      deadLetters: result.deadLetters,
      throughputHistory: appendHistory(throughputHistory, result.sample),
      logs: appendLogs(logs, result.logs),
    })
  },

  triggerLoadSpike: () => {
    if (spikeTimeout) clearTimeout(spikeTimeout)

    set({
      isLoadTestActive: true,
      loadMultiplier: SPIKE_MULTIPLIER,
    })

    get().pushLog({
      level: 'warn',
      source: 'load-simulator',
      message: 'Disparado pico de ~10k req/min — pressão propagando na topologia',
    })

    spikeTimeout = setTimeout(() => {
      get().stopLoadSpike()
    }, SPIKE_DURATION_MS)
  },

  stopLoadSpike: () => {
    if (spikeTimeout) {
      clearTimeout(spikeTimeout)
      spikeTimeout = null
    }
    set({
      isLoadTestActive: false,
      loadMultiplier: 1,
    })
    get().pushLog({
      level: 'success',
      source: 'load-simulator',
      message: 'Pico encerrado — sistema em recuperação',
    })
  },

  resetSimulation: () => {
    if (spikeTimeout) {
      clearTimeout(spikeTimeout)
      spikeTimeout = null
    }
    const { nodeKinds } = get()
    set({
      isLoadTestActive: false,
      loadMultiplier: 1,
      totalRps: 120,
      estimatedCostPerHour: BASELINE_COST,
      deadLetters: 0,
      nodeMetrics: metricsForRegisteredKinds(nodeKinds),
      failedNodeIds: {},
      throughputHistory: [],
      logs: [
        {
          id: createId('log'),
          timestamp: Date.now(),
          level: 'info',
          source: 'hyperflow',
          message: 'Simulação reiniciada para baseline (topologia do canvas preservada)',
        },
      ],
    })
  },

  pushLog: (log) => {
    set((state) => ({
      logs: appendLogs(state.logs, [
        {
          id: createId('log'),
          timestamp: log.timestamp ?? Date.now(),
          level: log.level,
          source: log.source,
          message: log.message,
        },
      ]),
    }))
  },

  registerNode: (id, kind) => {
    const { nodeMetrics, nodeKinds, isLoadTestActive } = get()
    if (nodeKinds[id]) return

    set({
      nodeKinds: { ...nodeKinds, [id]: kind },
      nodeMetrics: { ...nodeMetrics, [id]: createMetricsForKind(kind) },
    })

    if (isLoadTestActive && (kind === NodeKinds.Worker || kind === NodeKinds.Container)) {
      get().pushLog({
        level: 'success',
        source: id,
        message: 'Réplica adicionada — capacidade de consumo aumentou',
      })
    } else if (kind === NodeKinds.RabbitMQ) {
      get().pushLog({
        level: 'success',
        source: id,
        message: 'Broker adicional — pressão da fila será redistribuída',
      })
    }
  },

  unregisterNode: (id) => {
    const { nodeMetrics, nodeKinds, failedNodeIds } = get()
    if (!(id in nodeKinds)) return

    const restMetrics = { ...nodeMetrics }
    delete restMetrics[id]
    const restKinds = { ...nodeKinds }
    delete restKinds[id]
    const restFailed = { ...failedNodeIds }
    delete restFailed[id]

    set({
      nodeMetrics: restMetrics,
      nodeKinds: restKinds,
      failedNodeIds: restFailed,
    })
  },

  injectChaos: (nodeId, fault) => {
    const { nodeKinds } = get()
    const kind = nodeKinds[nodeId]
    set((state) => ({
      failedNodeIds: { ...state.failedNodeIds, [nodeId]: fault },
    }))

    if (kind === NodeKinds.Postgres) {
      get().pushLog({
        level: 'error',
        source: nodeId,
        message:
          'CHAOS — PostgreSQL indisponível. Escritas falham; leituras podem seguir via cache (degradação graciosa)',
      })
    } else if (kind === NodeKinds.Redis) {
      get().pushLog({
        level: 'error',
        source: nodeId,
        message: 'CHAOS — Redis sem memória. Hit rate colapsando, custo de banco deve subir',
      })
    } else if (kind === NodeKinds.Worker || kind === NodeKinds.Container) {
      get().pushLog({
        level: 'error',
        source: nodeId,
        message: 'CHAOS — Worker/réplica isolado. Fila deve crescer; mensagens podem ir para a DLQ',
      })
    } else {
      get().pushLog({
        level: 'error',
        source: nodeId,
        message: `CHAOS — falha ${fault} injetada em ${kindLabel(kind ?? NodeKinds.Worker)}`,
      })
    }
  },

  clearChaos: (nodeId) => {
    const { failedNodeIds } = get()
    if (!failedNodeIds[nodeId]) return
    const rest = { ...failedNodeIds }
    delete rest[nodeId]
    set({ failedNodeIds: rest })
    get().pushLog({
      level: 'success',
      source: nodeId,
      message: 'Nó restaurado — falha de chaos removida',
    })
  },

  clearAllChaos: () => {
    const { failedNodeIds } = get()
    if (Object.keys(failedNodeIds).length === 0) return
    set({ failedNodeIds: {} })
    get().pushLog({
      level: 'success',
      source: 'chaos',
      message: 'Todas as falhas de chaos foram restauradas',
    })
  },

  requeueDlq: () => {
    const { deadLetters, nodeMetrics, nodeKinds } = get()
    if (deadLetters <= 0) {
      get().pushLog({
        level: 'info',
        source: 'dlq',
        message: 'DLQ vazia — nada para reprocessar',
      })
      return
    }

    const rabbitIds = Object.entries(nodeKinds)
      .filter(([, kind]) => kind === NodeKinds.RabbitMQ)
      .map(([id]) => id)
    const perRabbit = Math.round(deadLetters / Math.max(rabbitIds.length, 1))
    const nextMetrics = { ...nodeMetrics }

    for (const id of rabbitIds) {
      const current = nextMetrics[id] as RabbitMQMetrics | undefined
      if (!current) continue
      nextMetrics[id] = {
        ...current,
        queueDepth: current.queueDepth + perRabbit,
        overflow: current.queueDepth + perRabbit >= 5_000,
      }
    }

    for (const [id, kind] of Object.entries(nodeKinds)) {
      if (kind !== NodeKinds.Dlq) continue
      nextMetrics[id] = {
        deadLetters: 0,
        lastReason: 'Requeue manual',
      }
    }

    set({
      nodeMetrics: nextMetrics,
      deadLetters: 0,
    })
    get().pushLog({
      level: 'success',
      source: 'dlq',
      message: `${deadLetters.toLocaleString('pt-BR')} mensagens reenfileiradas (requeue)`,
    })
  },
}))
