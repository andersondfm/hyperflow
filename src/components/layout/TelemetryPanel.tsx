import { MetricCards, ThroughputChart } from '@/components/telemetry/ThroughputChart'
import { LogStream } from '@/components/telemetry/LogStream'
import { FinOpsCard } from '@/components/telemetry/FinOpsCard'

export function TelemetryPanel() {
  return (
    <section className="flex h-56 shrink-0 flex-col border-t border-slate-800 bg-slate-950/90 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Observability
        </p>
        <h2 className="mt-0.5 font-display text-sm font-semibold text-slate-100">
          Telemetria & Logs
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
        <FinOpsCard variant="full" />
        <MetricCards />
        <ThroughputChart />
        <div className="min-h-0 flex-1">
          <LogStream />
        </div>
      </div>
    </section>
  )
}
