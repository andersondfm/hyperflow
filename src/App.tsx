import { ChallengeLayout } from '@/components/challenge/ChallengeLayout'
import { LifetimesLayout } from '@/components/dotnet/LifetimesLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FullStackLayout } from '@/components/layout/FullStackLayout'
import { Views, useViewStore } from '@/store/viewStore'

export function App() {
  const view = useViewStore((s) => s.view)

  if (view === Views.FullStack) return <FullStackLayout />
  if (view === Views.Challenge) return <ChallengeLayout />
  if (view === Views.Lifetimes) return <LifetimesLayout />
  return <DashboardLayout />
}
