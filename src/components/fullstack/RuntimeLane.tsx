import { Atom, Database, DatabaseZap, Gem, Layers, Play, Server, Share2, Timer } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { LayerIconKey, RuntimeLayer } from '@/data/fullstackProfile'
import { PROFILE, RUNTIME_LAYERS, RequestKinds } from '@/data/fullstackProfile'
import { StageStates, useDeliveryStore, type StageState } from '@/store/deliveryStore'
import { cn } from '@/lib/utils'

const ICONS: Record<LayerIconKey, typeof Atom> = {
  react: Atom,
  api: Server,
  application: Layers,
  domain: Gem,
  messaging: Share2,
  redis: DatabaseZap,
  sql: Database,
}

const ACCENT: Record<string, string> = {
  react: 'bg-cyan-400',
  api: 'bg-sky-400',
  application: 'bg-violet-400',
  messaging: 'bg-amber-400',
  domain: 'bg-emerald-400',
  sqlserver: 'bg-blue-400',
  redis: 'bg-rose-400',
}

const WRITE_FLOW = ['react', 'api', 'messaging', 'domain', 'sqlserver'] as const

const stateDot: Record<StageState, string> = {
  idle: 'bg-slate-600',
  active: 'bg-cyan-300 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.7)]',
  done: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]',
  failed: 'bg-rose-500 animate-pulse',
  skipped: 'bg-slate-700',
}

function ArchBox({
  flowId,
  layer,
  state,
  note,
  detail,
  badge,
  selected,
  dimmed,
  onSelect,
}: {
  flowId: string
  layer: RuntimeLayer
  state: StageState
  note?: string
  detail?: string
  badge?: string
  selected: boolean
  dimmed?: boolean
  onSelect: () => void
}) {
  const Icon = ICONS[layer.icon]
  const skipped = state === StageStates.Skipped || dimmed

  return (
    <button
      type="button"
      data-flow={flowId}
      onClick={onSelect}
      className={cn(
        'relative w-[196px] shrink-0 rounded-xl border bg-slate-900/95 text-left shadow-xl backdrop-blur-sm transition-all duration-300',
        skipped
          ? 'border-dashed border-slate-700 opacity-45'
          : state === StageStates.Active
            ? 'border-cyan-400/70 ring-1 ring-cyan-400/40'
            : state === StageStates.Done
              ? 'border-emerald-500/40'
              : state === StageStates.Failed
                ? 'border-rose-500/60'
                : layer.id === 'redis'
                  ? 'border-rose-500/50'
                  : 'border-slate-700/80',
        selected && 'ring-1 ring-cyan-300/70',
      )}
    >
      <span className="absolute top-1/2 -left-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-slate-900 bg-cyan-400" />
      <span className="absolute top-1/2 -right-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-slate-900 bg-cyan-400" />

      <div className="flex items-start gap-2.5 border-b border-slate-800/80 px-3 py-2.5">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-950',
            skipped ? 'bg-slate-700 text-slate-300' : ACCENT[layer.id],
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate font-display text-sm font-semibold text-slate-100">{layer.title}</p>
            <span className={cn('h-2 w-2 shrink-0 rounded-full', stateDot[state])} />
          </div>
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {layer.layer}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 px-3 py-2.5">
        <Metric label="DI" value={layer.di} tone="sky" />
        <Metric label="Estado" value={note ?? 'aguardando'} />
        {(detail || badge) && (
          <Metric label={badge === 'async' ? 'Fora da resposta' : 'Tempo'} value={detail ?? badge ?? '—'} />
        )}
      </div>
    </button>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'sky' }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span
        className={cn(
          'truncate font-mono text-[11px] font-medium',
          tone === 'sky' ? 'text-sky-300' : 'text-slate-100',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Wire() {
  return <div className="w-8 shrink-0 self-center" aria-hidden />
}

function Drop({ label }: { label: string }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-wider text-rose-300/80">{label}</span>
  )
}

export function RuntimeLane() {
  const layerStates = useDeliveryStore((s) => s.layerStates)
  const layerNotes = useDeliveryStore((s) => s.layerNotes)
  const layerMs = useDeliveryStore((s) => s.layerMs)
  const layerPhase = useDeliveryStore((s) => s.layerPhase)
  const responseMs = useDeliveryStore((s) => s.responseMs)
  const totalMs = useDeliveryStore((s) => s.totalMs)
  const running = useDeliveryStore((s) => s.running)
  const requestKind = useDeliveryStore((s) => s.requestKind)
  const selectedId = useDeliveryStore((s) => s.selectedId)
  const redisOn = useDeliveryStore((s) => s.redisOn)
  const runRequest = useDeliveryStore((s) => s.runRequest)
  const setRedisOn = useDeliveryStore((s) => s.setRedisOn)
  const select = useDeliveryStore((s) => s.select)

  const writeLayers = useMemo(
    () =>
      WRITE_FLOW.flatMap((id) => {
        const layer = RUNTIME_LAYERS.find((item) => item.id === id)
        return layer ? [layer] : []
      }),
    [],
  )
  const redisLayer = RUNTIME_LAYERS.find((item) => item.id === 'redis')
  const validatorLayer = RUNTIME_LAYERS.find((item) => item.id === 'application')
  const boardRef = useRef<HTMLDivElement>(null)
  const [paths, setPaths] = useState<
    ReadonlyArray<{ d: string; lit: boolean; tone: 'cyan' | 'rose' | 'violet' }>
  >([])

  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return

    const place = (id: string) => {
      const node = board.querySelector<HTMLElement>(`[data-flow="${id}"]`)
      if (!node) return null
      const boardBox = board.getBoundingClientRect()
      const box = node.getBoundingClientRect()
      return {
        left: box.left - boardBox.left,
        right: box.right - boardBox.left,
        top: box.top - boardBox.top,
        bottom: box.bottom - boardBox.top,
        midY: box.top - boardBox.top + box.height / 2,
        midX: box.left - boardBox.left + box.width / 2,
      }
    }

    const curve = (x1: number, y1: number, x2: number, y2: number) => {
      const bend = Math.max(36, Math.abs(x2 - x1) * 0.45)
      return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
    }

    const lit = (id: string) => {
      const state = layerStates[id] ?? StageStates.Idle
      return state === StageStates.Active || state === StageStates.Done
    }

    const next: Array<{ d: string; lit: boolean; tone: 'cyan' | 'rose' | 'violet' }> = []
    const pairs: ReadonlyArray<readonly [string, string]> = [
      ['react', 'api'],
      ['api', 'messaging'],
      ['messaging', 'domain'],
      ['domain', 'sqlserver'],
    ]
    for (const [from, to] of pairs) {
      const a = place(from)
      const b = place(to)
      if (!a || !b) continue
      next.push({
        d: curve(a.right, a.midY, b.left, b.midY),
        lit: lit(from) || lit(to),
        tone: 'cyan',
      })
    }

    const bff = place('api')
    const redis = place('redis')
    const sql = place('sqlserver')
    if (bff && redis) {
      next.push({
        d: `M ${bff.midX} ${bff.top} C ${bff.midX} ${bff.top - 28}, ${redis.midX} ${redis.bottom + 28}, ${redis.midX} ${redis.bottom}`,
        lit: redisOn && (lit('api') || lit('redis')),
        tone: 'rose',
      })
    }
    if (redis && sql && redisOn) {
      next.push({
        d: curve(redis.right, redis.midY, sql.left, sql.top + 18),
        lit: lit('redis') || lit('sqlserver'),
        tone: 'rose',
      })
    }
    const validator = place('application')
    if (bff && validator) {
      next.push({
        d: `M ${bff.midX} ${bff.bottom} C ${bff.midX} ${bff.bottom + 28}, ${validator.midX} ${validator.top - 28}, ${validator.midX} ${validator.top}`,
        lit: lit('api') || lit('application'),
        tone: 'violet',
      })
    }

    setPaths(next)
  }, [layerStates, redisOn, writeLayers])

  const box = (layer: RuntimeLayer, extra?: { dimmed?: boolean }): ReactNode => {
    const state = layerStates[layer.id] ?? StageStates.Idle
    const inScope = requestKind ? layer.kinds.includes(requestKind) : true
    const ms = layerMs[layer.id]
    return (
      <ArchBox
        flowId={layer.id}
        layer={layer}
        state={requestKind && !inScope && state === StageStates.Idle ? StageStates.Skipped : state}
        {...(layerNotes[layer.id] ? { note: layerNotes[layer.id] } : {})}
        {...(ms !== undefined ? { detail: `${ms} ms` } : {})}
        {...(layerPhase[layer.id] === 'async' ? { badge: 'async' } : {})}
        selected={selectedId === layer.id}
        {...(extra?.dimmed ? { dimmed: true } : {})}
        onSelect={() => select(layer.id)}
      />
    )
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
            Trilho 1 · Runtime
          </p>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Micro frontend → BFF → Kafka → IDR → SQL
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            O validador só devolve ok para o BFF. Quem publica no Kafka é o BFF. O SQL continua no fim.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5">
            <Timer className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Resposta</span>
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
        </div>
      </div>

      <div
        className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950 p-4"
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      >
        <div ref={boardRef} className="relative flex min-w-max items-center">
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {paths.map((path) => (
              <path
                key={path.d}
                d={path.d}
                fill="none"
                strokeWidth={1.6}
                className={
                  path.lit
                    ? path.tone === 'rose'
                      ? 'stroke-rose-400'
                      : path.tone === 'violet'
                        ? 'stroke-violet-400'
                        : 'stroke-cyan-400'
                    : path.tone === 'rose'
                      ? 'stroke-rose-400/35'
                      : path.tone === 'violet'
                        ? 'stroke-violet-400/40'
                        : 'stroke-slate-600'
                }
              />
            ))}
          </svg>
          {writeLayers.map((layer, index) => {
            if (layer.id === 'api' && redisLayer) {
              const redisState = !redisOn
                ? StageStates.Skipped
                : (layerStates.redis ?? StageStates.Idle)
              return (
                <div key={layer.id} className="flex items-end">
                  <Wire />
                  <div className="flex flex-col items-center gap-1">
                    <ArchBox
                      flowId="redis"
                      layer={redisLayer}
                      state={redisState}
                      {...(layerNotes.redis ? { note: layerNotes.redis } : {})}
                      {...(layerMs.redis !== undefined ? { detail: `${layerMs.redis} ms` } : {})}
                      selected={selectedId === 'redis'}
                      dimmed={!redisOn}
                      onSelect={() => select('redis')}
                    />
                    <Drop label="leitura" />
                    <button
                      type="button"
                      disabled={running}
                      onClick={() => setRedisOn(!redisOn)}
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                        redisOn
                          ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500',
                        running && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {redisOn ? 'Redis ligado' : 'Ligar Redis'}
                    </button>
                    {box(layer)}
                    <span className="font-mono text-[9px] uppercase tracking-wider text-violet-300/80">
                      ok volta
                    </span>
                    {validatorLayer && box(validatorLayer)}
                  </div>
                </div>
              )
            }

            return (
              <div key={layer.id} className="flex items-end">
                {index > 0 && <Wire />}
                {box(layer)}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
