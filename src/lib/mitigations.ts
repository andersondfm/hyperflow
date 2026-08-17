import { MitigationIds, type MitigationId } from '@/types/nodes'

export interface MitigationDef {
  id: MitigationId
  name: string
  effect: string
  azure: string
  aws: string
  logMessage: string
}

export const MITIGATION_PLAYBOOK: readonly MitigationDef[] = [
  {
    id: MitigationIds.RateLimit,
    name: 'Rate limit no Gateway',
    effect: 'Protege o ingress — fila para de explodir',
    azure: 'Azure APIM',
    aws: 'API Gateway throttling',
    logMessage:
      'Mitigação — rate limit no Gateway. Ingress protegido (Azure APIM / AWS API Gateway throttling)',
  },
  {
    id: MitigationIds.Autoscale,
    name: 'Autoscaling de workers',
    effect: 'Fila drena; custo sobe um pouco — de propósito',
    azure: 'AKS HPA / Container Apps',
    aws: 'ECS Auto Scaling / EKS HPA',
    logMessage:
      'Mitigação — autoscaling de consumidores. Capacidade subiu (AKS HPA / ECS Auto Scaling)',
  },
  {
    id: MitigationIds.AggressiveCache,
    name: 'Cache mais agressivo',
    effect: 'Hit rate sobe — Postgres e fatura aliviam',
    azure: 'Azure Cache for Redis',
    aws: 'ElastiCache (Redis)',
    logMessage:
      'Mitigação — cache agressivo. Hit rate recuperando (Azure Cache for Redis / ElastiCache)',
  },
  {
    id: MitigationIds.ReadReplica,
    name: 'Réplica de leitura',
    effect: 'Latência cai — leitura fora do primary',
    azure: 'Azure PostgreSQL replica',
    aws: 'RDS Read Replica / Aurora',
    logMessage:
      'Mitigação — réplica de leitura. Pressão sai do primary (Azure PostgreSQL / RDS Read Replica)',
  },
] as const

export function emptyMitigations(): Record<MitigationId, boolean> {
  return {
    [MitigationIds.RateLimit]: false,
    [MitigationIds.Autoscale]: false,
    [MitigationIds.AggressiveCache]: false,
    [MitigationIds.ReadReplica]: false,
  }
}

export function countActiveMitigations(active: Record<MitigationId, boolean>): number {
  let n = 0
  for (const def of MITIGATION_PLAYBOOK) {
    if (active[def.id]) n += 1
  }
  return n
}

export function mitigationById(id: MitigationId): MitigationDef {
  const found = MITIGATION_PLAYBOOK.find((item) => item.id === id)
  if (!found) {
    throw new Error(`Mitigação desconhecida: ${id}`)
  }
  return found
}
