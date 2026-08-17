import { create } from 'zustand'
import {
  CloudProviders,
  PIPELINE_STEPS,
  PROFILE,
  QUALITY_GATE,
  RUNTIME_LAYERS,
  RequestKinds,
  WriteStrategies,
  type CloudProvider,
  type RequestKind,
  type WriteStrategy,
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
  /** Etapa que roda fora do tempo da resposta HTTP. */
  async?: boolean
}

export type RunPhase = 'sync' | 'async'

interface DeliveryState {
  cloud: CloudProvider
  requestKind: RequestKind | null
  writeStrategy: WriteStrategy
  running: boolean
  /** Ordem em que os cards aparecem — muda conforme o fluxo executado. */
  runOrder: readonly string[]
  layerStates: Record<string, StageState>
  layerNotes: Record<string, string>
  layerMs: Record<string, number>
  layerPhase: Record<string, RunPhase>
  /** Tempo que o usuário espera até a resposta HTTP. */
  responseMs: number
  /** Ponta a ponta, incluindo o que roda fora da resposta. */
  totalMs: number
  cacheWarm: boolean
  insightCached: boolean
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
  setWriteStrategy: (strategy: WriteStrategy) => void
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

interface RunOptions {
  cacheWarm: boolean
  insightCached: boolean
  writeStrategy: WriteStrategy
}

/** Monta a sequência do request: leitura usa cache-aside, escrita depende da estratégia. */
function buildRun(kind: RequestKind, flags: RunOptions, resource: string): RunStep[] {
  const entryNote =
    kind === RequestKinds.Read ? 'GET' : kind === RequestKinds.Write ? 'POST' : 'INSIGHT'
  const entryMessage =
    kind === RequestKinds.Read
      ? `Componente pede GET /${resource} — estado de carregamento na tela`
      : kind === RequestKinds.Write
        ? `Formulário envia POST /${resource} — validação de contrato no cliente`
        : `Tela pede um insight sobre /${resource} — pergunta em linguagem natural`

  const steps: RunStep[] = [
    {
      layerId: 'react',
      ms: layerMs('react'),
      note: entryNote,
      log: { level: 'info', source: 'react', message: entryMessage },
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
      note: kind === RequestKinds.Write ? 'Command' : 'Query',
      log: {
        level: 'info',
        source: 'application',
        message:
          kind === RequestKinds.Write
            ? 'Application: Command handler abre unidade de trabalho'
            : 'Application: Query handler — leitura não abre transação de escrita',
      },
    },
  ]

  if (kind === RequestKinds.Insight) {
    if (flags.insightCached) {
      steps.push({
        layerId: 'redis',
        ms: layerMs('redis'),
        note: 'HIT',
        log: {
          level: 'success',
          source: 'redis',
          message: 'Redis HIT — mesma pergunta não paga token duas vezes. IA cara é IA sem cache',
        },
      })
      return steps
    }

    steps.push({
      layerId: 'redis',
      ms: layerMs('redis'),
      note: 'MISS',
      log: {
        level: 'warn',
        source: 'redis',
        message: 'Redis MISS — pergunta nova, vai custar token',
      },
    })
    steps.push({
      layerId: 'mongo',
      ms: layerMs('mongo'),
      note: 'contexto',
      log: {
        level: 'info',
        source: 'mongo',
        message: 'Mongo entrega o contexto do domínio — o prompt recebe dado, não achismo',
      },
    })
    steps.push({
      layerId: 'ai',
      ms: layerMs('ai'),
      note: 'GPT',
      log: {
        level: 'success',
        source: 'openai',
        message:
          'OpenAI responde em ~890 ms: saída validada contra schema, com timeout e fallback. Resultado cacheado',
      },
    })
    return steps
  }

  if (kind === RequestKinds.Read) {
    if (flags.cacheWarm) {
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
  } else if (flags.writeStrategy === WriteStrategies.QueueFirst) {
    steps.push({
      layerId: 'messaging',
      ms: layerMs('messaging'),
      note: 'aceito · 202',
      log: {
        level: 'success',
        source: 'messaging',
        message:
          'Comando aceito na fila com idempotency key — API devolve 202 e protocolo. O pico morre aqui, não no banco',
      },
    })
    steps.push({
      layerId: 'domain',
      ms: layerMs('domain'),
      note: 'no worker',
      async: true,
      log: {
        level: 'warn',
        source: 'domain',
        message:
          'A invariante roda no worker: rejeição aparece no endpoint de status, não na resposta do usuário',
      },
    })
    steps.push({
      layerId: 'sqlserver',
      ms: layerMs('sqlserver'),
      note: 'commit',
      async: true,
      log: {
        level: 'success',
        source: 'sqlserver',
        message: 'Worker persiste no ritmo do banco — escrita nivelada, sem estourar conexão',
      },
    })
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
      layerId: 'messaging',
      ms: layerMs('messaging'),
      note: 'outbox',
      async: true,
      log: {
        level: 'info',
        source: 'messaging',
        message:
          'Dispatcher publica o evento gravado na transação — sem evento fantasma se o commit falhar',
      },
    })
  }

  if (kind === RequestKinds.Write) {
    steps.push({
      layerId: 'mongo',
      ms: layerMs('mongo'),
      note: 'projeção',
      async: true,
      log: {
        level: 'info',
        source: 'mongo',
        message:
          'Consumidor idempotente projeta o documento de leitura (consistência eventual assumida)',
      },
    })
    steps.push({
      layerId: 'redis',
      ms: layerMs('redis'),
      note: 'invalidado',
      async: true,
      log: {
        level: 'warn',
        source: 'redis',
        message: 'Cache invalidado pela escrita — cache velho é bug silencioso',
      },
    })
  }

  return steps
}

function responseMessage(
  kind: RequestKind,
  strategy: WriteStrategy,
  responseMs: number,
  hasAsync: boolean,
): string {
  if (kind === RequestKinds.Read) {
    return `200 OK em ~${responseMs} ms — repita o GET para ver o cache quente`
  }
  if (kind === RequestKinds.Insight) {
    return `200 OK em ~${responseMs} ms — repita o insight: o cache responde sem custo de token`
  }
  if (strategy === WriteStrategies.QueueFirst) {
    return `202 Accepted em ~${responseMs} ms — cliente recebe protocolo; o worker segue sozinho`
  }
  return hasAsync
    ? `201 Created em ~${responseMs} ms — o usuário só espera até o commit`
    : `201 Created em ~${responseMs} ms`
}

function appendLogs(existing: DeliveryLog[], incoming: Omit<DeliveryLog, 'id'>[]): DeliveryLog[] {
  const next = [
    ...incoming.map((log) => ({ ...log, id: createId('dlog') })).reverse(),
    ...existing,
  ]
  return next.length > 40 ? next.slice(0, 40) : next
}

const CANONICAL_ORDER: readonly string[] = RUNTIME_LAYERS.map((layer) => layer.id)

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  cloud: CloudProviders.Azure,
  requestKind: null,
  writeStrategy: WriteStrategies.Outbox,
  running: false,
  runOrder: CANONICAL_ORDER,
  layerStates: idleLayers(),
  layerNotes: {},
  layerMs: {},
  layerPhase: {},
  responseMs: 0,
  totalMs: 0,
  cacheWarm: false,
  insightCached: false,
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

  setWriteStrategy: (strategy) => {
    if (get().running || get().writeStrategy === strategy) return
    set({ writeStrategy: strategy })
    get().select('messaging')
    set((state) => ({
      logs: appendLogs(state.logs, [
        {
          level: 'info',
          source: 'escrita',
          message:
            strategy === WriteStrategies.QueueFirst
              ? 'Estratégia: fila primeiro. Devolvo 202 e absorvo o pico — o cliente recebe protocolo, não o ID'
              : 'Estratégia: outbox. Commit e evento na mesma transação — devolvo 201 com o ID',
        },
      ]),
    }))
  },

  runRequest: (kind) => {
    if (get().running) return
    clearTimers()

    const { cacheWarm, insightCached, writeStrategy } = get()
    const steps = buildRun(kind, { cacheWarm, insightCached, writeStrategy }, PROFILE.resource)
    const order = steps.map((step) => step.layerId)
    const phase: Record<string, RunPhase> = {}
    for (const step of steps) phase[step.layerId] = step.async ? 'async' : 'sync'

    const lastSyncIndex = steps.reduce((acc, step, index) => (step.async ? acc : index), 0)
    const hasAsync = steps.some((step) => step.async)

    set({
      running: true,
      requestKind: kind,
      runOrder: [...order, ...CANONICAL_ORDER.filter((id) => !order.includes(id))],
      layerStates: idleLayers(),
      layerNotes: {},
      layerMs: {},
      layerPhase: phase,
      responseMs: 0,
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
            set((state) => {
              const responseMs = step.async ? state.responseMs : state.responseMs + step.ms
              const logs: Omit<DeliveryLog, 'id'>[] = [step.log]

              if (index === lastSyncIndex) {
                logs.push({
                  level: 'success',
                  source: 'response',
                  message: responseMessage(kind, writeStrategy, responseMs, hasAsync),
                })
              }

              return {
                layerStates: { ...state.layerStates, [step.layerId]: StageStates.Done },
                layerNotes: { ...state.layerNotes, [step.layerId]: step.note },
                layerMs: { ...state.layerMs, [step.layerId]: step.ms },
                responseMs,
                totalMs: state.totalMs + step.ms,
                logs: appendLogs(state.logs, logs),
              }
            })
          },
          index * STEP_INTERVAL_MS + STEP_INTERVAL_MS * 0.75,
        ),
      )
    })

    timers.push(
      setTimeout(
        () => {
          const { responseMs, totalMs } = get()
          const extra = totalMs - responseMs

          set((state) => ({
            running: false,
            cacheWarm:
              kind === RequestKinds.Read
                ? true
                : kind === RequestKinds.Write
                  ? false
                  : state.cacheWarm,
            insightCached: kind === RequestKinds.Insight ? true : state.insightCached,
            logs: hasAsync
              ? appendLogs(state.logs, [
                  {
                    level: 'info',
                    source: 'propagação',
                    message: `Propagação concluída (+${extra} ms) fora do tempo da resposta — evento, projeção e cache`,
                  },
                ])
              : state.logs,
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
      runOrder: CANONICAL_ORDER,
      layerStates: idleLayers(),
      layerNotes: {},
      layerMs: {},
      layerPhase: {},
      responseMs: 0,
      totalMs: 0,
      cacheWarm: false,
      insightCached: false,
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
          'Teste integrado verde — SQL Server, Redis, Mongo e RabbitMQ reais em container (Testcontainers)',
      }
    case 'e2e':
      return {
        level: 'success',
        source: 'cypress',
        message: 'Cypress verde no fluxo crítico — testado no navegador, não na intenção',
      }
    case 'load':
      return {
        level: 'success',
        source: 'k6',
        message: 'K6: p95 dentro do acordado e sem regressão contra o baseline da versão anterior',
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
        message:
        'Rolling update no Kubernetes com migration compatível — health check antes do tráfego',
      }
    case 'observability':
      return {
        level: 'success',
        source: 'observability',
        message:
        'Trace ponta a ponta com correlation id — Dynatrace e Grafana com alerta em cima de erro e latência',
      }
    default:
      return { level: 'info', source: stepId, message: 'Etapa concluída' }
  }
}
