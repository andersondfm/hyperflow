import { useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { hottestRabbitMetrics, QUEUE_FAST_TICK_DEPTH } from '@/lib/simulationEngine'

const IDLE_INTERVAL_MS = 1_200
const SPIKE_INTERVAL_MS = 400

/** Mantém o motor de simulação tickando em background. */
export function useSimulationTicker(): void {
  const tick = useSimulationStore((s) => s.tick)
  const isLoadTestActive = useSimulationStore((s) => s.isLoadTestActive)
  const queueNeedsFastTicks = useSimulationStore((s) => {
    const rabbit = hottestRabbitMetrics(s.nodeMetrics, s.nodeKinds)
    return (rabbit?.queueDepth ?? 0) > QUEUE_FAST_TICK_DEPTH
  })

  useEffect(() => {
    const interval = isLoadTestActive || queueNeedsFastTicks ? SPIKE_INTERVAL_MS : IDLE_INTERVAL_MS
    const id = window.setInterval(() => {
      tick()
    }, interval)
    return () => window.clearInterval(id)
  }, [tick, isLoadTestActive, queueNeedsFastTicks])
}
