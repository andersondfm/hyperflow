import { create } from 'zustand'
import {
  CloudProviders,
  PIPELINE_STEPS,
  PROFILE,
  QUALITY_GATE,
  RUNTIME_LAYERS,
  RequestKinds,
  type CloudProvider,
  type RequestKind,
} from '@/data/fullstackProfile'
import { createId } from '@/lib/utils'

export const StageStates = {
  Idle: 'idle',
  Active: 'active',
  Done: 'done',
  Failed: 'failed',
  Skipped: 'skipped',
} as const

export type StageState = (typeof StageStates)[keyof typeof StageStates]

export interface DeliveryLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'success'
  source: string
  message: string
}

interface RunStep {
  layerId: string
  ms: number
  note: string
  log: Omit<DeliveryLog, 'id'>
}

interface DeliveryState {
  cloud: CloudProvider
  requestKind: RequestKind | null
  running: boolean
  layerStates: Record<string, StageState>
  layerNotes: Record<string, string>
  layerMs: Record<string, number>
  totalMs: number
  cacheWarm: boolean
  pipelineRunning: boolean
  pipelineStates: Record<string, StageState>
  coverage: number
  smells: number
  gatePassed: boolean | null
  tddApplied: boolean
  deployed: boolean
  selectedId: string | null
  logs: DeliveryLog[]
  setCloud: (cloud: CloudProvider) => void
  runRequest: (kind: RequestKind) => void
  runPipeline: () => void
  applyTdd: () => void
  select: (id: string | null) => void
  resetAll: () => void
}

const STEP_INTERVAL_MS = 430

let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers(): void {
  for (const id of timers) clearTimeout(id)
  timers = []
}

function idleLayers(): Record<string, StageState> {
  const map: Record<string, StageState> = {}
  for (const layer of RUNTIME_LAYERS) map[layer.id] = StageStates.Idle
  return map
}

function idlePipeline(): Record<string, StageState> {
  const map: Record<string, StageState> = {}
  for (const step of PIPELINE_STEPS) map[step.id] = StageStates.Idle
  return map
}

function layerMs(id: string): number {
  return RUNTIME_LAYERS.find((layer) => layer.id === id)?.baseMs ?? 0
}

/** Monta a sequência do request: leitura usa cache-aside, escrita passa pelo domínio. */
function buildRun(kind: RequestKind, cacheWarm: boolean, resource: string): RunStep[] {
  const steps: RunStep[] = [
    {
      layerId: 'react',
      ms: layerMs('react'),
      note: kind === RequestKinds.Read ? 'GET' : 'POST',
      log: {
        level: 'info',
        source: 'react',
        message:
          kind === RequestKinds.Read
            ? `Componente pede GET /${resource} — estado de carregamento na tela`
            : `Formulário envia POST /${resource} — validação de contrato no cliente`,
      },
    },
    {
      layerId: 'api',
      ms: layerMs('api'),
      note: 'DTO',
      log: {
        level: 'info',
        source: 'api',
        message: 'API .NET: JWT válido, DTO aceito, entidade de domínio não vaza no contrato',
      },
    },
    {
      layerId: 'application',
      ms: layerMs('application'),
      note: kind === RequestKinds.Read ? 'Query' : 'Command',
      log: {
        level: 'info',
        source: 'application',
        message:
          kind === RequestKinds.Read
            ? 'Application: Query handler — leitura não abre transação de escrita'
            : 'Application: Command handler abre unidade de trabalho',
      },
    },
  ]

  if (kind === RequestKinds.Read) {
    if (cacheWarm) {
      steps.push({
        layerId: 'redis',
        ms: layerMs('redis'),
        note: 'HIT',
        log: {
          level: 'success',
          source: 'redis',
          message: 'Redis HIT — resposta sem tocar no banco. É aqui que a conta encolhe',
        },
      })
    } else {
      steps.push({
        layerId: 'redis',
        ms: layerMs('redis'),
        note: 'MISS',
        log: {
          level: 'warn',
          source: 'redis',
          message: 'Redis MISS — cache frio, cai na fonte (cache-aside)',
        },
      })
      steps.push({
        layerId: 'mongo',
        ms: layerMs('mongo'),
        note: 'read model',
        log: {
          level: 'info',
          source: 'mongo',
          message: 'MongoDB: documento de leitura já montado — sem join caro',
        },
      })
    }
  } else {
    steps.push({
      layerId: 'domain',
      ms: layerMs('domain'),
      note: 'invariante',
      log: {
        level: 'info',
        source: 'domain',
        message: 'Domain: agregado valida a invariante — objeto inválido não chega ao banco',
      },
    })
    steps.push({
      layerId: 'sqlserver',
      ms: layerMs('sqlserver'),
      note: 'commit',
      log: {
        level: 'success',
        source: 'sqlserver',
        message: 'SQL Server: transação confirmada — fonte da verdade da escrita',
      },
    })
    steps.push({
      layerId: 'mongo',
      ms: layerMs('mongo'),
      note: 'projeção',
      log: {
        level: 'info',
        source: 'mongo',
        message: 'Domain Event projeta o documento de leitura (consistência eventual assumida)',
      },
    })
    steps.push({
      layerId: 'redis',
      ms: layerMs('redis'),
      note: 'invalidado',
      log: {
        level: 'warn',
        source: 'redis',
        message: 'Cache invalidado pela escrita — cache velho é bug silencioso',
      },
    })
  }

  return steps
}

function appendLogs(existing: DeliveryLog[], incoming: Omit<DeliveryLog, 'id'>[]): DeliveryLog[] {
  const next = [
    ...incoming.map((log) => ({ ...log, id: createId('dlog') })).reverse(),
    ...existing,
  ]
  return next.length > 40 ? next.slice(0, 40) : next
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  cloud: CloudProviders.Azure,
  requestKind: null,
  running: false,
  layerStates: idleLayers(),
  layerNotes: {},
  layerMs: {},
  totalMs: 0,
  cacheWarm: false,
  pipelineRunning: false,
  pipelineStates: idlePipeline(),
  coverage: QUALITY_GATE.coverageBefore,
  smells: QUALITY_GATE.smellsBefore,
  gatePassed: null,
  tddApplied: false,
  deployed: false,
  selectedId: null,
  logs: [],

  setCloud: (cloud) => {
    set({ cloud })
    set((state) => ({
      logs: appendLogs(state.logs, [
        {
          level: 'info',
          source: 'cloud',
          message:
            cloud === CloudProviders.Azure
              ? 'Nuvem: Azure — mesma arquitetura, nomes da Microsoft'
              : 'Nuvem: AWS — mesma arquitetura, nomes da Amazon',
        },
      ]),
    }))
  },

  runRequest: (kind) => {
    if (get().running) return
    clearTimers()

    const steps = buildRun(kind, get().cacheWarm, PROFILE.resource)

    set({
      running: true,
      requestKind: kind,
      layerStates: idleLayers(),
      layerNotes: {},
      layerMs: {},
      totalMs: 0,
    })

    steps.forEach((step, index) => {
      timers.push(
        setTimeout(() => {
          set((state) => ({
            layerStates: { ...state.layerStates, [step.layerId]: StageStates.Active },
          }))
        }, index * STEP_INTERVAL_MS),
      )

      timers.push(
        setTimeout(
          () => {
            set((state) => ({
              layerStates: { ...state.layerStates, [step.layerId]: StageStates.Done },
              layerNotes: { ...state.layerNotes, [step.layerId]: step.note },
              layerMs: { ...state.layerMs, [step.layerId]: step.ms },
              totalMs: state.totalMs + step.ms,
              logs: appendLogs(state.logs, [step.log]),
            }))
          },
          index * STEP_INTERVAL_MS + STEP_INTERVAL_MS * 0.75,
        ),
      )
    })

    timers.push(
      setTimeout(
        () => {
          const total = get().totalMs
          set((state) => ({
            running: false,
            cacheWarm: kind === RequestKinds.Read,
            logs: appendLogs(state.logs, [
              {
                level: 'success',
                source: 'response',
                message:
                  kind === RequestKinds.Read
                    ? `200 OK em ~${total} ms — repita o GET para ver o cache quente`
                    : `201 Created em ~${total} ms — escrita, projeção e cache resolvidos`,
              },
            ]),
          }))
        },
        steps.length * STEP_INTERVAL_MS + 120,
      ),
    )
  },

  runPipeline: () => {
    if (get().pipelineRunning) return
    clearTimers()

    const tdd = get().tddApplied
    const coverage = tdd ? QUALITY_GATE.coverageAfter : QUALITY_GATE.coverageBefore
    const smells = tdd ? QUALITY_GATE.smellsAfter : QUALITY_GATE.smellsBefore

    set({
      pipelineRunning: true,
      pipelineStates: idlePipeline(),
      gatePassed: null,
      deployed: false,
      coverage,
      smells,
    })

    let elapsed = 0

    for (const step of PIPELINE_STEPS) {
      const startAt = elapsed
      const endAt = elapsed + step.durationMs
      elapsed = endAt

      timers.push(
        setTimeout(() => {
          set((state) => ({
            pipelineStates: { ...state.pipelineStates, [step.id]: StageStates.Active },
          }))
        }, startAt),
      )

      timers.push(
        setTimeout(() => {
          const gateFails = step.id === 'sonar' && coverage < QUALITY_GATE.minCoverage

          if (gateFails) {
            set((state) => ({
              pipelineRunning: false,
              gatePassed: false,
              pipelineStates: {
                ...state.pipelineStates,
                sonar: StageStates.Failed,
                deploy: StageStates.Skipped,
                observability: StageStates.Skipped,
              },
              logs: appendLogs(state.logs, [
                {
                  level: 'error',
                  source: 'sonar',
                  message: `Quality gate REPROVADO — cobertura ${coverage}% < ${QUALITY_GATE.minCoverage}%, ${smells} code smells. Merge bloqueado`,
                },
              ]),
            }))
            clearTimers()
            return
          }

          set((state) => ({
            pipelineStates: { ...state.pipelineStates, [step.id]: StageStates.Done },
            gatePassed: step.id === 'sonar' ? true : state.gatePassed,
            deployed: step.id === 'deploy' ? true : state.deployed,
            pipelineRunning: step.id === 'observability' ? false : state.pipelineRunning,
            logs: appendLogs(state.logs, [pipelineLog(step.id, coverage, smells)]),
          }))
        }, endAt),
      )
    }
  },

  applyTdd: () => {
    clearTimers()
    set((state) => ({
      tddApplied: true,
      pipelineRunning: false,
      pipelineStates: idlePipeline(),
      gatePassed: null,
      deployed: false,
      coverage: QUALITY_GATE.coverageAfter,
      smells: QUALITY_GATE.smellsAfter,
      logs: appendLogs(state.logs, [
        {
          level: 'success',
          source: 'tdd',
          message: `Teste escrito primeiro na regra que faltava — cobertura ${QUALITY_GATE.coverageAfter}%, ${QUALITY_GATE.smellsAfter} smell. Rode o pipeline de novo`,
        },
      ]),
    }))
  },

  select: (id) => set({ selectedId: id }),

  resetAll: () => {
    clearTimers()
    set({
      requestKind: null,
      running: false,
      layerStates: idleLayers(),
      layerNotes: {},
      layerMs: {},
      totalMs: 0,
      cacheWarm: false,
      pipelineRunning: false,
      pipelineStates: idlePipeline(),
      coverage: QUALITY_GATE.coverageBefore,
      smells: QUALITY_GATE.smellsBefore,
      gatePassed: null,
      tddApplied: false,
      deployed: false,
      selectedId: null,
      logs: [],
    })
  },
}))

function pipelineLog(
  stepId: string,
  coverage: number,
  smells: number,
): Omit<DeliveryLog, 'id'> {
  switch (stepId) {
    case 'github':
      return {
        level: 'info',
        source: 'github',
        message: 'PR aberto — branch protegida exige review e check verde',
      }
    case 'build':
      return {
        level: 'info',
        source: 'build',
        message: 'Build .NET + React OK — imagem marcada com o SHA do commit',
      }
    case 'unit':
      return {
        level: 'success',
        source: 'unit',
        message: `Testes de unidade verdes — cobertura ${coverage}%`,
      }
    case 'integration':
      return {
        level: 'success',
        source: 'integration',
        message:
          'Teste integrado verde — SQL Server, Redis e Mongo reais em container (Testcontainers)',
      }
    case 'sonar':
      return {
        level: 'success',
        source: 'sonar',
        message: `Quality gate APROVADO — cobertura ${coverage}%, ${smells} smell`,
      }
    case 'deploy':
      return {
        level: 'success',
        source: 'deploy',
        message: 'Deploy blue/green com migration compatível — health check antes do tráfego',
      }
    case 'observability':
      return {
        level: 'success',
        source: 'observability',
        message: 'Trace ponta a ponta com correlation id — alerta em cima de erro e latência',
      }
    default:
      return { level: 'info', source: stepId, message: 'Etapa concluída' }
  }
}
