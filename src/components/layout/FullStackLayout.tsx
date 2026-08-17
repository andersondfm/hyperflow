import { Braces, RotateCcw } from 'lucide-react'
import { PROFILE } from '@/data/fullstackProfile'
import { useDeliveryStore } from '@/store/deliveryStore'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { CloudToggle } from '@/components/fullstack/CloudToggle'
import { RuntimeLane } from '@/components/fullstack/RuntimeLane'
import { PipelineLane } from '@/components/fullstack/PipelineLane'
import { DetailPanel } from '@/components/fullstack/DetailPanel'

const STACK_CHIPS: readonly string[] = [
  '.NET 8/9 · ASP.NET Core',
  'React 19 · Angular 17',
  'Clean Architecture',
  'DDD · SOLID',
  'TDD · BDD',
  'RabbitMQ · Kafka',
  'SQL Server · Oracle · MySQL',
  'MongoDB',
  'Redis',
  'Cypress',
  'K6',
  'SonarQube',
  'Docker · Kubernetes',
  'GitHub Actions',
  'Dynatrace · Grafana',
  'OpenAI · NLP',
]

export function FullStackLayout() {
  const resetAll = useDeliveryStore((s) => s.resetAll)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400 text-slate-950">
            <Braces className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold tracking-tight text-slate-50">
              HyperFlow · {PROFILE.role}
            </h1>
            <p className="hidden truncate font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">
              {PROFILE.headline} · {PROFILE.years}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ViewTabs />
          <CloudToggle />
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(167,139,250,0.07),_transparent_55%)] p-3">
          <p className="mb-3 text-[11px] leading-snug text-slate-500">{PROFILE.tagline}</p>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {STACK_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono text-[10px] text-slate-400"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <RuntimeLane />
            <PipelineLane />
          </div>
        </main>

        <DetailPanel />
      </div>
    </div>
  )
}
