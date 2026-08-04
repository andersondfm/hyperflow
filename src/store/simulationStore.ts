import { create } from 'zustand'
import type { NodeMetricsMap, NodeKind, SimulationLog, ThroughputSample } from '@/types/nodes'
import {
  appendHistory,
  appendLogs,
  createInitialNodeMetrics,
  simulateTick,
} from '@/lib/simulationEngine'
import { createId } from '@/lib/utils'

interface SimulationState {
  isLoadTestActive: boolean
  loadMultiplier: number
  totalRps: number
  nodeMetrics: Record<string, NodeMetricsMap[NodeKind]>
  throughputHistory: ThroughputSample[]
  logs: SimulationLog[]
  tick: () => void
  triggerLoadSpike: () => void
  stopLoadSpike: () => void
  resetSimulation: () => void
  pushLog: (log: Omit<SimulationLog, 'id' | 'timestamp'> & { timestamp?: number }) => void
}

const SPIKE_MULTIPLIER = 10 // ~10k req/min equivalent scaling from baseline
const SPIKE_DURATION_MS = 18_000

let spikeTimeout: ReturnType<typeof setTimeout> | null = null

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isLoadTestActive: false,
  loadMultiplier: 1,
  totalRps: 120,
  nodeMetrics: createInitialNodeMetrics(),
  throughputHistory: [],
  logs: [
    {
      id: createId('log'),
      timestamp: Date.now(),
      level: 'info',
      source: 'hyperflow',
      message: 'Simulador inicializado — topologia de referência pronta',
    },
  ],

  tick: () => {
    const { nodeMetrics, loadMultiplier, isLoadTestActive, throughputHistory, logs } = get()
    const result = simulateTick(nodeMetrics, loadMultiplier, isLoadTestActive)
    set({
      nodeMetrics: result.nodeMetrics,
      totalRps: result.totalRps,
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
    set({
      isLoadTestActive: false,
      loadMultiplier: 1,
      totalRps: 120,
      nodeMetrics: createInitialNodeMetrics(),
      throughputHistory: [],
      logs: [
        {
          id: createId('log'),
          timestamp: Date.now(),
          level: 'info',
          source: 'hyperflow',
          message: 'Simulação reiniciada para baseline',
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
}))
