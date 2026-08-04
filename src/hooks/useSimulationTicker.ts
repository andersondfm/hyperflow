import { useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'

const IDLE_INTERVAL_MS = 1_200
const SPIKE_INTERVAL_MS = 400

/** Mantém o motor de simulação tickando em background. */
export function useSimulationTicker(): void {
  const tick = useSimulationStore((s) => s.tick)
  const isLoadTestActive = useSimulationStore((s) => s.isLoadTestActive)

  useEffect(() => {
    const interval = isLoadTestActive ? SPIKE_INTERVAL_MS : IDLE_INTERVAL_MS
    const id = window.setInterval(() => {
      tick()
    }, interval)
    return () => window.clearInterval(id)
  }, [tick, isLoadTestActive])
}
