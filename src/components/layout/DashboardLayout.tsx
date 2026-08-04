import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TelemetryPanel } from '@/components/layout/TelemetryPanel'
import { FlowCanvas } from '@/components/canvas/FlowCanvas'
import { useSimulationTicker } from '@/hooks/useSimulationTicker'

export function DashboardLayout() {
  useSimulationTicker()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1">
          <Sidebar />
          <main className="relative min-w-0 flex-1 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.06),_transparent_55%)]">
            <FlowCanvas />
          </main>
        </div>
        <TelemetryPanel />
      </div>
    </div>
  )
}
