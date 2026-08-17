import {
  Beaker,
  FlaskConical,
  Gauge,
  GitPullRequest,
  Hammer,
  Rocket,
  ShieldCheck,
  TestTube,
} from 'lucide-react'
import type { PipelineIconKey } from '@/data/fullstackProfile'
import { PIPELINE_STEPS, QUALITY_GATE } from '@/data/fullstackProfile'
import { StageStates, useDeliveryStore } from '@/store/deliveryStore'
import { StageCard, StageConnector } from '@/components/fullstack/StageCard'
import { cn } from '@/lib/utils'

const ICONS: Record<PipelineIconKey, typeof Hammer> = {
  github: GitPullRequest,
  build: Hammer,
  unit: FlaskConical,
  integration: Beaker,
  sonar: ShieldCheck,
  deploy: Rocket,
  observability: Gauge,
}

export function PipelineLane() {
  const pipelineStates = useDeliveryStore((s) => s.pipelineStates)
  const pipelineRunning = useDeliveryStore((s) => s.pipelineRunning)
  const coverage = useDeliveryStore((s) => s.coverage)
  const smells = useDeliveryStore((s) => s.smells)
  const gatePassed = useDeliveryStore((s) => s.gatePassed)
  const tddApplied = useDeliveryStore((s) => s.tddApplied)
  const selectedId = useDeliveryStore((s) => s.selectedId)
  const runPipeline = useDeliveryStore((s) => s.runPipeline)
  const applyTdd = useDeliveryStore((s) => s.applyTdd)
  const select = useDeliveryStore((s) => s.select)

  const gateFailed = gatePassed === false

  return (
    <section
      className={cn(
        'rounded-xl border p-3 transition-colors',
        gateFailed ? 'border-rose-500/45 bg-rose-950/10' : 'border-slate-800 bg-slate-950/60',
      )}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300/70">
            Trilho 2 · Entrega
          </p>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Do commit à produção
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            O gate reprova de propósito na primeira rodada. É aí que entra o TDD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Cobertura
            </span>
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                coverage >= QUALITY_GATE.minCoverage ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {coverage.toFixed(1)}%
            </span>
            <span className="font-mono text-[9px] text-slate-600">
              min {QUALITY_GATE.minCoverage}% · {smells} smell
            </span>
          </div>

          {gateFailed && !tddApplied && (
            <button
              type="button"
              onClick={applyTdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <TestTube className="h-3.5 w-3.5" />
              Escrever teste primeiro (TDD)
            </button>
          )}

          <button
            type="button"
            disabled={pipelineRunning}
            onClick={runPipeline}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
              pipelineRunning
                ? 'cursor-not-allowed border-slate-800 text-slate-600'
                : 'border-violet-500/40 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25',
            )}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            {tddApplied ? 'Rodar pipeline de novo' : 'Abrir Pull Request'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-y-2">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = ICONS[step.icon]
          const state = pipelineStates[step.id] ?? StageStates.Idle

          return (
            <div key={step.id} className="flex items-center">
              {index > 0 && <StageConnector lit={state !== StageStates.Idle} />}
              <StageCard
                title={step.title}
                subtitle={step.subtitle}
                icon={<Icon className="h-4 w-4" strokeWidth={2.25} />}
                state={state}
                {...(step.id === 'sonar' && gatePassed !== null
                  ? { note: gatePassed ? 'gate ok' : 'gate falhou' }
                  : {})}
                selected={selectedId === step.id}
                onSelect={() => select(step.id)}
              />
            </div>
          )
        })}
      </div>

      {gateFailed && (
        <p className="mt-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] leading-snug text-rose-200">
          Merge bloqueado pelo quality gate. Cobertura {coverage.toFixed(1)}% abaixo de{' '}
          {QUALITY_GATE.minCoverage}%. Deploy e observabilidade nem foram executados — é assim que
          eu evito levar dívida para produção.
        </p>
      )}
    </section>
  )
}
