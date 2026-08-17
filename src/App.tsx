import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FullStackLayout } from '@/components/layout/FullStackLayout'
import { Views, useViewStore } from '@/store/viewStore'

export function App() {
  const view = useViewStore((s) => s.view)

  return view === Views.FullStack ? <FullStackLayout /> : <DashboardLayout />
}
