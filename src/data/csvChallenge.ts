/**
 * Desafio: processar 1 milhão de linhas CSV dentro de um SLA de 20 minutos.
 * Os números são conservadores de propósito — a conta tem que sobreviver a pergunta.
 */

export const CSV_CHALLENGE = {
  rows: 1_000_000,
  slaSeconds: 20 * 60,
  batchSize: 10_000,
  /** EF Core SaveChanges por linha, com round-trip. Otimista: na prática costuma ser pior. */
  naiveRowsPerSec: 80,
  /** SqlBulkCopy de um worker, lote de 10 mil, linha larga o bastante para não ser micro-benchmark. */
  bulkRowsPerSec: 8_000,
  /** Linhas que não passam na validação e vão para o arquivo de erro, sem abortar o arquivo. */
  invalidRatio: 0.0015,
} as const

export const WORKER_OPTIONS = [1, 2, 4, 8] as const

export type StageIconKey =
  | 'ftp'
  | 'stream'
  | 'queue'
  | 'workers'
  | 'bulk'
  | 'poison'
  | 'checkpoint'
  | 'reports'

export interface ChallengeStage {
  id: string
  title: string
  subtitle: string
  icon: StageIconKey
  /** O que eu recusei, em uma linha. */
  rejected: string
  /** Por que esta peça existe. */
  because: readonly string[]
}

export const CHALLENGE_STAGES: readonly ChallengeStage[] = [
  {
    id: 'ftp',
    title: 'Entrada por FTP',
    subtitle: 'O cliente só entrega o arquivo',
    icon: 'ftp',
    rejected: 'Ler e processar linha a linha direto no FTP',
    because: [
      'Um job busca o CSV na pasta de entrada. O cliente não chama API nenhuma.',
      'Copio o arquivo para disco local antes de parsear. FTP cai no minuto 12; disco local não.',
      'Renomeio para processando/ e, no fim, para processados/. O próximo ciclo não pega o mesmo arquivo duas vezes.',
    ],
  },
  {
    id: 'stream',
    title: 'Stream de lotes',
    subtitle: '10 mil linhas por vez',
    icon: 'stream',
    rejected: 'List<T> com 1 milhão de objetos',
    because: [
      'Um milhão de linhas a ~1 KB, mais o overhead de objeto no .NET, passa fácil de 2 GB.',
      'Leio com stream (CsvHelper / PipeReader) e fecho o lote em 10 mil.',
      'A memória fica constante. O processo não morre no meio por OOM.',
    ],
  },
  {
    id: 'queue',
    title: 'Fila de lotes',
    subtitle: '100 mensagens, não 1 milhão',
    icon: 'queue',
    rejected: 'Kafka “porque é escala”',
    because: [
      'São 100 mensagens (1 milhão ÷ 10 mil), cada uma com o id do lote.',
      'Uma fila resolve. Kafka entra se eu já tenho a plataforma ou se o negócio exige replay e retenção.',
      'Inventar log distribuído para um job de 20 minutos é over-engineering — e over-engineering também reprova.',
    ],
  },
  {
    id: 'workers',
    title: 'Workers com teto',
    subtitle: 'Escala até o banco, não além',
    icon: 'workers',
    rejected: '“Sobe 50 pods que fica mais rápido”',
    because: [
      'Um worker com bulk copy já cabe no SLA. A fila existe para retry e para não apostar os 20 minutos num processo só.',
      'Quatro consumidores é o ponto em que o banco ainda acompanha.',
      'Oito ou mais só brigam por lock e pool de conexão. O teto é o SQL Server, não a quantidade de container.',
    ],
  },
  {
    id: 'bulk',
    title: 'SqlBulkCopy',
    subtitle: 'Lote, não linha',
    icon: 'bulk',
    rejected: 'SaveChanges dentro do foreach',
    because: [
      'ORM por linha faz um round-trip por registro. A ~80 linhas/s, 1 milhão leva mais de 3 horas.',
      'Bulk copy manda o lote de 10 mil de uma vez para uma tabela de staging.',
      'Depois um MERGE set-based aplica no destino. Transação por lote: se um lote falha, eu não desfaço os outros 99.',
    ],
  },
  {
    id: 'poison',
    title: 'Linha ruim isolada',
    subtitle: 'O arquivo não morre',
    icon: 'poison',
    rejected: 'Abortar 1 milhão por uma data inválida',
    because: [
      'Cada linha quebrada já sai com número da linha, motivo e o trecho original. Isso é a matéria-prima do relatório da área comercial.',
      'O lote segue. O comercial corrige as inconsistências, não reenvia o milhão.',
      'Estourar o SLA inteiro por causa de um registro é o erro clássico de tratar validação como exceção fatal.',
    ],
  },
  {
    id: 'checkpoint',
    title: 'Checkpoint',
    subtitle: 'Retry sem duplicar',
    icon: 'checkpoint',
    rejected: 'Recomeçar do byte zero se cair no minuto 12',
    because: [
      'Cada lote confirmado é um checkpoint. Cair no minuto 12 retoma do último id.',
      'O id do lote é a chave de idempotência: a fila entrega ao menos uma vez, o MERGE não duplica.',
      'Sem isso, o retry — que era para salvar o SLA — vira dado duplicado.',
    ],
  },
  {
    id: 'reports',
    title: 'Dois relatórios',
    subtitle: 'Comercial, no mesmo SLA',
    icon: 'reports',
    rejected: 'Varrer o CSV de novo para montar o relatório',
    because: [
      'Sucesso e inconsistência nascem durante o lote. Não existe um segundo job de 20 minutos.',
      'sucesso.csv é um agregado no SQL: total recebido, gravado, valor e o id do arquivo. Segundos, não minutos.',
      'inconsistencias.csv é o arquivo que os workers já foram appendando: linha, motivo e o trecho. A área comercial abre esse, não o milhão.',
      'Os dois voltam para o FTP, na pasta de saída, antes de renomear o original para processados/.',
    ],
  },
]

/** Eficiência cai quando vários workers disputam o mesmo banco. */
export function workerEfficiency(workers: number): number {
  if (workers <= 1) return 0.9
  if (workers <= 2) return 0.85
  if (workers <= 4) return 0.75
  if (workers <= 8) return 0.55
  return 0.35
}

export function requiredRowsPerSec(): number {
  return Math.ceil(CSV_CHALLENGE.rows / CSV_CHALLENGE.slaSeconds)
}

export function naiveSeconds(): number {
  return Math.round(CSV_CHALLENGE.rows / CSV_CHALLENGE.naiveRowsPerSec)
}

/** Tempo de parede estimado: insert em paralelo + orquestração (cópia do FTP, parse, checkpoint). */
export function planSeconds(workers: number): number {
  const rate = CSV_CHALLENGE.bulkRowsPerSec * workers * workerEfficiency(workers)
  const insert = CSV_CHALLENGE.rows / rate
  const orchestration = 45
  return Math.max(1, Math.round(insert + orchestration))
}

export function planRowsPerSec(workers: number): number {
  return Math.round(CSV_CHALLENGE.bulkRowsPerSec * workers * workerEfficiency(workers))
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}min`
  }
  return `${minutes}min ${String(seconds).padStart(2, '0')}s`
}
