import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FolderDown,
  Database,
  FileWarning,
  Layers,
  Play,
  RotateCcw,
  Split,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  CHALLENGE_STAGES,
  CSV_CHALLENGE,
  WORKER_OPTIONS,
  formatClock,
  naiveSeconds,
  planRowsPerSec,
  planSeconds,
  requiredRowsPerSec,
  workerEfficiency,
  type StageIconKey,
} from '@/data/csvChallenge'
import { useChallengeStore } from '@/store/challengeStore'
import { ViewTabs } from '@/components/layout/ViewTabs'
import { formatNumber, cn } from '@/lib/utils'

const ICONS: Record<StageIconKey, LucideIcon> = {
  ftp: FolderDown,
  stream: Split,
  queue: Layers,
  workers: Users,
  bulk: Database,
  poison: FileWarning,
  checkpoint: CheckCircle2,
  reports: FileSpreadsheet,
}

export function ChallengeLayout() {
  const workers = useChallengeStore((s) => s.workers)
  const running = useChallengeStore((s) => s.running)
  const done = useChallengeStore((s) => s.done)
  const processed = useChallengeStore((s) => s.processed)
  const invalid = useChallengeStore((s) => s.invalid)
  const elapsed = useChallengeStore((s) => s.elapsedProductionSec)
  const activeStageId = useChallengeStore((s) => s.activeStageId)
  const selectedStageId = useChallengeStore((s) => s.selectedStageId)
  const setWorkers = useChallengeStore((s) => s.setWorkers)
  const selectStage = useChallengeStore((s) => s.selectStage)
  const run = useChallengeStore((s) => s.run)
  const reset = useChallengeStore((s) => s.reset)

  const stage = CHALLENGE_STAGES.find((item) => item.id === selectedStageId) ?? CHALLENGE_STAGES[0]
  const eta = planSeconds(workers)
  const naive = naiveSeconds()
  const fits = eta < CSV_CHALLENGE.slaSeconds
  const rate = planRowsPerSec(workers)
  const needed = requiredRowsPerSec()
  const progress = processed / CSV_CHALLENGE.rows
  const committed = Math.max(0, processed - invalid)
  const contended = workerEfficiency(workers) < 0.7

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-slate-950">
            <Timer className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold tracking-tight text-slate-50">
              HyperFlow · 1 milhão em 20 minutos
            </h1>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">
              CSV no FTP · SLA de 20 minutos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <ViewTabs />
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.06),_transparent_55%)] p-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            <Meter label="SLA" value="20 min" hint={`${formatNumber(needed)} linhas/s no mínimo`} />
            <Meter
              label="Este plano"
              value={formatClock(eta)}
              hint={`${formatNumber(rate)} linhas/s · ${workers} worker${workers > 1 ? 's' : ''}`}
              tone={fits ? 'ok' : 'bad'}
            />
            <Meter
              label="EF por linha"
              value={formatClock(naive)}
              hint={`~${CSV_CHALLENGE.naiveRowsPerSec} linhas/s · estoura o SLA`}
              tone="bad"
            />
            <Meter
              label="Folga"
              value={formatClock(CSV_CHALLENGE.slaSeconds - eta)}
              hint="sobra para retry, validação e disco"
              tone="ok"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Workers
            </span>
            {WORKER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={running}
                onClick={() => setWorkers(option)}
                className={cn(
                  'rounded-md border px-2.5 py-1 font-mono text-xs font-semibold transition',
                  workers === option
                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500',
                  running && 'cursor-not-allowed opacity-60',
                )}
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              disabled={running}
              onClick={run}
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                running
                  ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300',
              )}
            >
              <Play className="h-3.5 w-3.5" />
              Processar 1 milhão
            </button>
          </div>

          {contended && (
            <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Mais worker não encurta na mesma proporção. O teto é o banco: lock, pool e disco. Quatro é o ponto em que ainda vale a pena.
            </p>
          )}

          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300/80">
                  {done ? 'Concluído dentro do SLA' : running ? 'Processando' : 'Pronto para rodar'}
                </p>
                <p className="font-display text-2xl font-bold tabular-nums text-slate-50">
                  {formatNumber(committed)}
                  <span className="ml-1 font-mono text-xs font-medium text-slate-500">
                    gravadas · {formatNumber(invalid)} inválidas isoladas
                  </span>
                </p>
              </div>
              <p className="font-mono text-sm tabular-nums text-slate-300">
                {formatClock(elapsed)}
                <span className="text-slate-600"> / {formatClock(eta)}</span>
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-rose-400/80"
                style={{ width: `${(naive > 0 ? Math.min(1, elapsed / naive) : 0) * 100}%` }}
                title="Onde o EF por linha ainda estaria"
              />
            </div>
            <p className="mt-1 font-mono text-[9px] text-slate-600">
              Barra de baixo: o caminho por linha, no mesmo relógio. Ela nem sai do lugar.
            </p>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <ReportCard
              title="sucesso.csv"
              audience="Área comercial · o que entrou"
              count={formatNumber(committed)}
              unit="linhas gravadas"
              ready={done}
              lines={[
                'total recebido, gravado e rejeitado',
                'agregado no SQL, sem reler o CSV',
                'devolvido na pasta de saída do FTP',
              ]}
            />
            <ReportCard
              title="inconsistencias.csv"
              audience="Área comercial · o que não entrou"
              count={formatNumber(invalid)}
              unit="linhas para corrigir"
              ready={done}
              lines={[
                'número da linha, motivo e o trecho original',
                'appendado por lote, enquanto processa',
                'o comercial corrige isso, não o arquivo de 1 milhão',
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CHALLENGE_STAGES.map((item, index) => {
              const Icon = ICONS[item.icon]
              const selected = item.id === stage?.id
              const live = item.id === activeStageId
              const passed = done || (running && CHALLENGE_STAGES.findIndex((s) => s.id === activeStageId) > index)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectStage(item.id)}
                  className={cn(
                    'w-[148px] rounded-lg border px-2.5 py-2 text-left transition',
                    live
                      ? 'border-amber-400/70 bg-amber-500/10 shadow-[0_0_18px_rgba(251,191,36,0.2)]'
                      : passed
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/40',
                    selected && 'ring-1 ring-amber-400/60',
                  )}
                >
                  <Icon className={cn('h-4 w-4', live || passed ? 'text-amber-300' : 'text-slate-500')} />
                  <p className="mt-1.5 font-display text-[12px] font-semibold text-slate-100">{item.title}</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{item.subtitle}</p>
                </button>
              )
            })}
          </div>
        </main>

        <aside className="flex h-72 shrink-0 flex-col border-t border-slate-800 bg-slate-950/90 lg:h-auto lg:w-96 lg:border-l lg:border-t-0">
          {stage && (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Por que esta decisão</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-50">{stage.title}</h2>
              <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] leading-snug text-rose-100">
                Recusei: {stage.rejected}
              </p>
              <ul className="mt-3 space-y-2">
                {stage.because.map((line) => (
                  <li key={line} className="flex gap-2 text-[13px] leading-snug text-slate-300">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-t border-slate-800 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">A conta, em uma frase</p>
            <p className="mt-1 text-[13px] leading-snug text-slate-300">
              1 milhão ÷ 20 minutos exige {formatNumber(needed)} linhas/s. Por linha eu entrego ~{CSV_CHALLENGE.naiveRowsPerSec}. Em bulk, um worker já passa de {formatNumber(CSV_CHALLENGE.bulkRowsPerSec)}. Os dois relatórios da área comercial saem do que o lote já gravou — não de uma segunda leitura do CSV.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ReportCard({
  title,
  audience,
  count,
  unit,
  ready,
  lines,
}: {
  title: string
  audience: string
  count: string
  unit: string
  ready: boolean
  lines: readonly string[]
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{audience}</p>
          <p className="font-display text-sm font-semibold text-slate-100">{title}</p>
        </div>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase',
            ready ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500',
          )}
        >
          {ready ? 'no FTP' : 'no lote'}
        </span>
      </div>
      <p className="mt-2 font-display text-xl font-bold tabular-nums text-slate-50">
        {count}
        <span className="ml-1 font-mono text-[10px] font-medium text-slate-500">{unit}</span>
      </p>
      <ul className="mt-2 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-[11px] leading-snug text-slate-400">
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Meter({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'ok' | 'bad'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        tone === 'ok'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : tone === 'bad'
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-slate-800 bg-slate-900/50',
      )}
    >
      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          'font-display text-lg font-bold tabular-nums',
          tone === 'ok' ? 'text-emerald-300' : tone === 'bad' ? 'text-rose-300' : 'text-slate-100',
        )}
      >
        {value}
      </p>
      <p className="font-mono text-[9px] leading-snug text-slate-600">{hint}</p>
    </div>
  )
}
