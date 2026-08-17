import {
  Atom,
  Brain,
  Database,
  DatabaseZap,
  Gem,
  Layers,
  Leaf,
  Play,
  Server,
  Share2,
  Timer,
} from 'lucide-react'
import { useMemo } from 'react'
import type { LayerIconKey, WriteStrategy } from '@/data/fullstackProfile'
import {
  PROFILE,
  RUNTIME_LAYERS,
  RequestKinds,
  WRITE_STRATEGY_META,
  WriteStrategies,
} from '@/data/fullstackProfile'
import { StageStates, useDeliveryStore } from '@/store/deliveryStore'
import { StageCard, StageConnector } from '@/components/fullstack/StageCard'
import { cn } from '@/lib/utils'

const ICONS: Record<LayerIconKey, typeof Atom> = {
  react: Atom,
  api: Server,
  application: Layers,
  domain: Gem,
  messaging: Share2,
  redis: DatabaseZap,
  sql: Database,
  mongo: Leaf,
  ai: Brain,
}

export function RuntimeLane() {
  const layerStates = useDeliveryStore((s) => s.layerStates)
  const layerNotes = useDeliveryStore((s) => s.layerNotes)
  const layerMs = useDeliveryStore((s) => s.layerMs)
  const layerPhase = useDeliveryStore((s) => s.layerPhase)
  const responseMs = useDeliveryStore((s) => s.responseMs)
  const totalMs = useDeliveryStore((s) => s.totalMs)
  const running = useDeliveryStore((s) => s.running)
  const cacheWarm = useDeliveryStore((s) => s.cacheWarm)
  const insightCached = useDeliveryStore((s) => s.insightCached)
  const requestKind = useDeliveryStore((s) => s.requestKind)
  const selectedId = useDeliveryStore((s) => s.selectedId)
  const runOrder = useDeliveryStore((s) => s.runOrder)
  const writeStrategy = useDeliveryStore((s) => s.writeStrategy)
  const runRequest = useDeliveryStore((s) => s.runRequest)
  const setWriteStrategy = useDeliveryStore((s) => s.setWriteStrategy)
  const select = useDeliveryStore((s) => s.select)

  const orderedLayers = useMemo(() => {
    const byId = new Map(RUNTIME_LAYERS.map((layer) => [layer.id, layer]))
    const ordered = runOrder.flatMap((id) => {
      const layer = byId.get(id)
      return layer ? [layer] : []
    })
    const seen = new Set(runOrder)
    return [...ordered, ...RUNTIME_LAYERS.filter((layer) => !seen.has(layer.id))]
  }, [runOrder])

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
            Trilho 1 · Runtime
          </p>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Ciclo de vida do request
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Clique num card para ver o que eu decido em cada camada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5"
            title="Resposta é o que o usuário espera. O resto propaga fora do request."
          >
            <Timer className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Resposta
            </span>
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                responseMs > 0 && responseMs <= 30 ? 'text-emerald-300' : 'text-cyan-300',
              )}
            >
              {responseMs > 0 ? `${responseMs} ms` : '—'}
            </span>
            {totalMs > responseMs && (
              <span className="font-mono text-[10px] tabular-nums text-violet-300">
                +{totalMs - responseMs} ms async
              </span>
            )}
          </div>

          <div
            className={cn(
              'rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
              cacheWarm || insightCached
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-500',
            )}
            title="Cache-aside: o segundo request responde do Redis"
          >
            {cacheWarm || insightCached ? 'cache quente' : 'cache frio'}
          </div>

          <button
            type="button"
            disabled={running}
            onClick={() => runRequest(RequestKinds.Read)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              running
                ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
            )}
          >
            <Play className="h-3.5 w-3.5" />
            GET /{PROFILE.resource}
          </button>

          <button
            type="button"
            disabled={running}
            onClick={() => runRequest(RequestKinds.Write)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
              running
                ? 'cursor-not-allowed border-slate-800 text-slate-600'
                : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20',
            )}
          >
            <Play className="h-3.5 w-3.5" />
            POST /{PROFILE.resource}
          </button>

          <button
            type="button"
            disabled={running}
            onClick={() => runRequest(RequestKinds.Insight)}
            title="Fluxo de IA do WorkBia: contexto do domínio + OpenAI, com cache e fallback"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
              running
                ? 'cursor-not-allowed border-slate-800 text-slate-600'
                : 'border-violet-500/40 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25',
            )}
          >
            <Brain className="h-3.5 w-3.5" />
            Insight com IA
          </button>
        </div>
      </div>

      <div className="mb-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Estratégia da escrita
        </span>
        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/60 p-0.5">
          {(
            [WriteStrategies.Outbox, WriteStrategies.QueueFirst] as readonly WriteStrategy[]
          ).map((option) => {
            const meta = WRITE_STRATEGY_META[option]
            return (
              <button
                key={option}
                type="button"
                disabled={running}
                onClick={() => setWriteStrategy(option)}
                title={meta.hint}
                className={cn(
                  'rounded px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition',
                  writeStrategy === option
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  running && 'cursor-not-allowed opacity-60',
                )}
              >
                {meta.label} · {meta.status}
                {meta.recommended && (
                  <span
                    className={cn(
                      'ml-1 normal-case',
                      writeStrategy === option ? 'text-slate-800' : 'text-emerald-400/80',
                    )}
                  >
                    ★
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="min-w-0 flex-1 text-[10px] leading-snug text-slate-500">
          {WRITE_STRATEGY_META[writeStrategy].recommended && (
            <span className="mr-1 font-mono uppercase tracking-wider text-emerald-400/80">
              ★ recomendado
            </span>
          )}
          {WRITE_STRATEGY_META[writeStrategy].hint}
        </p>
      </div>

      <div className="flex flex-wrap items-stretch gap-y-2">
        {orderedLayers.map((layer, index) => {
          const Icon = ICONS[layer.icon]
          const state = layerStates[layer.id] ?? StageStates.Idle
          const inScope = requestKind ? layer.kinds.includes(requestKind) : true
          const ms = layerMs[layer.id]

          return (
            <div key={layer.id} className="flex items-center">
              {index > 0 && <StageConnector lit={state !== StageStates.Idle} />}
              <StageCard
                title={layer.title}
                subtitle={layer.layer}
                icon={<Icon className="h-4 w-4" strokeWidth={2.25} />}
                state={
                  requestKind && !inScope && state === StageStates.Idle
                    ? StageStates.Skipped
                    : state
                }
                {...(layerNotes[layer.id] ? { note: layerNotes[layer.id] } : {})}
                {...(ms !== undefined ? { detail: `${ms} ms` } : {})}
                {...(layerPhase[layer.id] === 'async' ? { badge: 'async' } : {})}
                selected={selectedId === layer.id}
                onSelect={() => select(layer.id)}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
