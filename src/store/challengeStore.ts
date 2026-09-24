import { create } from 'zustand'
import {
  CHALLENGE_STAGES,
  CSV_CHALLENGE,
  planSeconds,
} from '@/data/csvChallenge'

const DEMO_MS = 8_000
const TICK_MS = 80

interface ChallengeState {
  workers: number
  running: boolean
  done: boolean
  processed: number
  invalid: number
  elapsedProductionSec: number
  activeStageId: string | null
  selectedStageId: string | null
  setWorkers: (workers: number) => void
  selectStage: (id: string | null) => void
  run: () => void
  reset: () => void
}

let timer: ReturnType<typeof setInterval> | null = null

function stop(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  workers: 4,
  running: false,
  done: false,
  processed: 0,
  invalid: 0,
  elapsedProductionSec: 0,
  activeStageId: null,
  selectedStageId: CHALLENGE_STAGES[0]?.id ?? null,

  setWorkers: (workers) => {
    if (get().running) return
    set({ workers })
  },

  selectStage: (id) => set({ selectedStageId: id }),

  run: () => {
    if (get().running) return
    stop()
    const targetSec = planSeconds(get().workers)
    const started = Date.now()
    set({
      running: true,
      done: false,
      processed: 0,
      invalid: 0,
      elapsedProductionSec: 0,
      activeStageId: CHALLENGE_STAGES[0]?.id ?? null,
    })

    timer = setInterval(() => {
      const ratio = Math.min(1, (Date.now() - started) / DEMO_MS)
      const stageIndex = Math.min(
        CHALLENGE_STAGES.length - 1,
        Math.floor(ratio * CHALLENGE_STAGES.length),
      )
      const stageId = CHALLENGE_STAGES[stageIndex]?.id ?? null
      const processed = Math.round(CSV_CHALLENGE.rows * ratio)
      set({
        processed,
        invalid: Math.round(processed * CSV_CHALLENGE.invalidRatio),
        elapsedProductionSec: targetSec * ratio,
        activeStageId: stageId,
        selectedStageId: stageId,
      })
      if (ratio >= 1) {
        stop()
        set({
          running: false,
          done: true,
          processed: CSV_CHALLENGE.rows,
          invalid: Math.round(CSV_CHALLENGE.rows * CSV_CHALLENGE.invalidRatio),
          elapsedProductionSec: targetSec,
          activeStageId: null,
        })
      }
    }, TICK_MS)
  },

  reset: () => {
    stop()
    set({
      running: false,
      done: false,
      processed: 0,
      invalid: 0,
      elapsedProductionSec: 0,
      activeStageId: null,
      selectedStageId: CHALLENGE_STAGES[0]?.id ?? null,
    })
  },
}))
