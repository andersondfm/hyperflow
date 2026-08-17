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
import type { LayerIconKey } from '@/data/fullstackProfile'
import { PROFILE, RUNTIME_LAYERS, RequestKinds } from '@/data/fullstackProfile'
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
  const totalMs = useDeliveryStore((s) => s.totalMs)
  const running = useDeliveryStore((s) => s.running)
  const cacheWarm = useDeliveryStore((s) => s.cacheWarm)
  const insightCached = useDeliveryStore((s) => s.insightCached)
  const requestKind = useDeliveryStore((s) => s.requestKind)
  const selectedId = useDeliveryStore((s) => s.selectedId)
  const runRequest = useDeliveryStore((s) => s.runRequest)
  const select = useDeliveryStore((s) => s.select)

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
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5">
            <Timer className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Latência
            </span>
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                totalMs > 0 && totalMs <= 30 ? 'text-emerald-300' : 'text-cyan-300',
              )}
            >
              {totalMs > 0 ? `${totalMs} ms` : '—'}
            </span>
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

      <div className="flex flex-wrap items-stretch gap-y-2">
        {RUNTIME_LAYERS.map((layer, index) => {
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
