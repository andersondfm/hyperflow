import type { ChaosFault, NodeKind, PaletteItem } from '@/types/nodes'
import { NodeKinds } from '@/types/nodes'

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function isNodeKind(value: string): value is NodeKind {
  return (Object.values(NodeKinds) as string[]).includes(value)
}

export const NODE_PALETTE: readonly PaletteItem[] = [
  {
    kind: NodeKinds.ApiGateway,
    label: 'API Gateway',
    description: 'Load balancer / ingress com RPS',
    accent: 'cyan',
  },
  {
    kind: NodeKinds.Redis,
    label: 'Redis Cache',
    description: 'Cache em memória — Hit/Miss',
    accent: 'rose',
  },
  {
    kind: NodeKinds.RabbitMQ,
    label: 'RabbitMQ',
    description: 'Fila de mensagens assíncronas',
    accent: 'amber',
  },
  {
    kind: NodeKinds.Postgres,
    label: 'PostgreSQL',
    description: 'Banco relacional — latência',
    accent: 'sky',
  },
  {
    kind: NodeKinds.Worker,
    label: 'Worker',
    description: 'Microsserviço com circuit breaker',
    accent: 'emerald',
  },
  {
    kind: NodeKinds.Container,
    label: 'Réplica / Container',
    description: 'Réplica k8s — sobe capacidade',
    accent: 'teal',
  },
  {
    kind: NodeKinds.IntegrationTest,
    label: 'Teste Integrado',
    description: 'CI — status e cobertura',
    accent: 'violet',
  },
  {
    kind: NodeKinds.Sonar,
    label: 'SonarQube',
    description: 'Quality gate — bugs e vulns',
    accent: 'orange',
  },
  {
    kind: NodeKinds.Dlq,
    label: 'Dead Letter Queue',
    description: 'Mensagens mortas — requeue',
    accent: 'red',
  },
] as const

export function healthFromThreshold(
  value: number,
  warningAt: number,
  criticalAt: number,
  higherIsWorse = true,
): 'healthy' | 'warning' | 'critical' {
  if (higherIsWorse) {
    if (value >= criticalAt) return 'critical'
    if (value >= warningAt) return 'warning'
    return 'healthy'
  }
  if (value <= criticalAt) return 'critical'
  if (value <= warningAt) return 'warning'
  return 'healthy'
}

export function kindLabel(kind: NodeKind): string {
  return NODE_PALETTE.find((item) => item.kind === kind)?.label ?? kind
}

export type CostTone = 'cyan' | 'amber' | 'rose'

export function costTone(cost: number, isSpike: boolean): CostTone {
  if (cost >= 70) return 'rose'
  if (isSpike || cost >= 28) return 'amber'
  return 'cyan'
}

export function faultLabel(fault: ChaosFault): string {
  switch (fault) {
    case 'down':
      return 'DOWN'
    case 'oom':
      return 'OOM'
    case 'timeout':
      return 'TIMEOUT'
  }
}
